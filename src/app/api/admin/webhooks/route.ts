import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { safeJson, isErrorResponse } from '@/lib/safe-json'
import { emitWebhookEvent } from '@/lib/webhooks'

const SETTINGS_PATH = join(process.cwd(), 'webhook-settings.json')

// All supported events with descriptions
const ALL_EVENTS: Record<string, { enabled: boolean; description: string }> = {
  'customer.registered': { enabled: true, description: 'A new customer signs up' },
  'order.created': { enabled: true, description: 'A new order is placed' },
  'order.status_changed': { enabled: true, description: 'An order status is updated' },
  'order.cancelled': { enabled: true, description: 'An order is cancelled' },
  'inventory.low_stock': { enabled: true, description: 'Product stock falls below threshold' },
  'inventory.out_of_stock': { enabled: true, description: 'Product goes out of stock' },
  'review.created': { enabled: true, description: 'A customer leaves a review' },
  'product.created': { enabled: true, description: 'A new product is added' },
  'product.updated': { enabled: true, description: 'A product is edited' },
  'product.deleted': { enabled: true, description: 'A product is removed' },
}

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

interface RawSettings {
  enabled: boolean
  secret: string
  endpoints: Array<{
    id: string
    name?: string
    label?: string
    url: string
    events: string[]
    active: boolean
    headers?: Record<string, string>
    createdAt?: string
  }>
  events?: Record<string, { enabled: boolean; description: string }>
  lowStockThreshold: number
  retries?: number
  retryAttempts?: number
  timeoutMs: number
}

function loadRawSettings(): RawSettings {
  if (!existsSync(SETTINGS_PATH)) {
    return { enabled: false, secret: '', endpoints: [], lowStockThreshold: 20, retries: 2, timeoutMs: 10000 }
  }
  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'))
  } catch {
    return { enabled: false, secret: '', endpoints: [], lowStockThreshold: 20, retries: 2, timeoutMs: 10000 }
  }
}

function toClientSettings(raw: RawSettings) {
  return {
    enabled: raw.enabled,
    secret: raw.secret ? '••••••••' : '',
    endpoints: (raw.endpoints || []).map(ep => ({
      id: ep.id,
      label: ep.label || ep.name || '',
      url: ep.url,
      events: ep.events || [],
      active: ep.active,
      createdAt: ep.createdAt || new Date().toISOString(),
    })),
    events: raw.events || ALL_EVENTS,
    lowStockThreshold: raw.lowStockThreshold || 20,
    retryAttempts: raw.retryAttempts ?? raw.retries ?? 2,
    timeoutMs: raw.timeoutMs || 10000,
  }
}

function saveSettings(clientSettings: Record<string, unknown>) {
  const current = loadRawSettings()

  // If secret is masked, keep the existing one
  const secret = clientSettings.secret === '••••••••'
    ? current.secret
    : (clientSettings.secret as string || current.secret)

  const endpoints = Array.isArray(clientSettings.endpoints)
    ? (clientSettings.endpoints as Array<Record<string, unknown>>).map(ep => ({
        id: ep.id as string,
        name: (ep.label as string) || (ep.name as string) || '',
        label: (ep.label as string) || (ep.name as string) || '',
        url: ep.url as string,
        events: ep.events as string[],
        active: ep.active as boolean,
        headers: {},
        createdAt: (ep.createdAt as string) || new Date().toISOString(),
      }))
    : current.endpoints

  const saved = {
    enabled: clientSettings.enabled ?? current.enabled,
    secret,
    endpoints,
    events: (clientSettings.events as Record<string, { enabled: boolean; description: string }>) || ALL_EVENTS,
    lowStockThreshold: (clientSettings.lowStockThreshold as number) ?? current.lowStockThreshold,
    retries: (clientSettings.retryAttempts as number) ?? current.retries ?? 2,
    retryAttempts: (clientSettings.retryAttempts as number) ?? current.retryAttempts ?? 2,
    timeoutMs: (clientSettings.timeoutMs as number) ?? current.timeoutMs,
  }

  writeFileSync(SETTINGS_PATH, JSON.stringify(saved, null, 2), 'utf-8')
  return saved
}

// GET — return settings + deliveries in the format the UI expects
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const raw = loadRawSettings()
  return NextResponse.json({
    settings: toClientSettings(raw),
    deliveries: [],
  })
}

// PUT — update webhook settings
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body

  const saved = saveSettings(body as Record<string, unknown>)
  return NextResponse.json({
    settings: toClientSettings(saved),
    success: true,
  })
}

// POST — test a webhook endpoint
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body

  const { url } = body as { url?: string }
  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  // Try to deliver a test event directly to the URL
  try {
    const testPayload = {
      event: 'order.created',
      timestamp: new Date().toISOString(),
      data: {
        _test: true,
        orderId: 'test-order-123',
        email: 'test@example.com',
        total: 99.99,
        items: [{ productName: 'Test Product', quantity: 1, price: 99.99 }],
        paymentMethod: 'card',
        status: 'pending',
      },
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Event': 'order.created' },
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (res.ok) {
      return NextResponse.json({ success: true, statusCode: res.status })
    } else {
      return NextResponse.json({ success: false, statusCode: res.status, error: res.statusText })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection failed'
    return NextResponse.json({ success: false, error: message })
  }
}
