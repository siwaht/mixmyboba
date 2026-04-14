import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { safeJson, isErrorResponse } from '@/lib/safe-json'
import { emitWebhookEvent } from '@/lib/webhooks'

const SETTINGS_PATH = join(process.cwd(), 'webhook-settings.json')

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

function loadSettings() {
  if (!existsSync(SETTINGS_PATH)) {
    return { enabled: false, secret: '', endpoints: [], lowStockThreshold: 20, retries: 2, timeoutMs: 10000 }
  }
  return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'))
}

function saveSettings(settings: Record<string, unknown>) {
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8')
}

// GET — return current webhook settings (secrets masked)
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const settings = loadSettings()
  // Mask the secret for display
  return NextResponse.json({
    ...settings,
    secret: settings.secret ? '••••••••' : '',
  })
}

// PUT — update webhook settings
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body

  const data = body as Record<string, unknown>
  const current = loadSettings()

  // If secret is masked, keep the existing one
  const secret = data.secret === '••••••••' ? current.secret : (data.secret || current.secret)

  const updated = {
    enabled: data.enabled ?? current.enabled,
    secret,
    endpoints: Array.isArray(data.endpoints) ? data.endpoints : current.endpoints,
    lowStockThreshold: data.lowStockThreshold ?? current.lowStockThreshold,
    retries: data.retries ?? current.retries,
    timeoutMs: data.timeoutMs ?? current.timeoutMs,
  }

  saveSettings(updated)
  return NextResponse.json({ success: true })
}

// POST — test a webhook endpoint by sending a test event
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body

  const { endpointId } = body as { endpointId?: string }
  if (!endpointId) {
    return NextResponse.json({ error: 'endpointId is required' }, { status: 400 })
  }

  const settings = loadSettings()
  const endpoint = settings.endpoints?.find((ep: { id: string }) => ep.id === endpointId)
  if (!endpoint || !endpoint.url) {
    return NextResponse.json({ error: 'Endpoint not found or has no URL' }, { status: 404 })
  }

  // Fire a test event
  emitWebhookEvent('order.created', {
    _test: true,
    orderId: 'test-order-123',
    email: 'test@example.com',
    total: 99.99,
    items: [{ product: 'Test Product', quantity: 1, price: 99.99 }],
    paymentMethod: 'card',
    status: 'pending',
  })

  return NextResponse.json({ success: true, message: 'Test event dispatched' })
}
