import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createHmac } from 'crypto'

// ─── Types ───

export type WebhookEventType =
  | 'customer.registered'
  | 'order.created'
  | 'order.status_changed'
  | 'inventory.low_stock'
  | 'inventory.out_of_stock'
  | 'review.created'
  | 'product.updated'

interface WebhookEndpoint {
  id: string
  name: string
  url: string
  events: WebhookEventType[]
  active: boolean
  headers?: Record<string, string>
}

interface WebhookSettings {
  enabled: boolean
  secret: string
  endpoints: WebhookEndpoint[]
  lowStockThreshold: number
  retries: number
  timeoutMs: number
}

interface WebhookPayload {
  event: WebhookEventType
  timestamp: string
  data: Record<string, unknown>
}

// ─── Settings ───

const SETTINGS_PATH = join(process.cwd(), 'webhook-settings.json')

function loadSettings(): WebhookSettings {
  if (!existsSync(SETTINGS_PATH)) {
    return { enabled: false, secret: '', endpoints: [], lowStockThreshold: 20, retries: 2, timeoutMs: 10000 }
  }
  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'))
  } catch {
    return { enabled: false, secret: '', endpoints: [], lowStockThreshold: 20, retries: 2, timeoutMs: 10000 }
  }
}

// ─── Signature ───

function signPayload(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex')
}

// ─── Delivery ───

async function deliverWebhook(
  endpoint: WebhookEndpoint,
  payload: WebhookPayload,
  settings: WebhookSettings
): Promise<{ success: boolean; status?: number; error?: string }> {
  const body = JSON.stringify(payload)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Webhook-Event': payload.event,
    'X-Webhook-Timestamp': payload.timestamp,
    ...(endpoint.headers || {}),
  }

  // Add HMAC signature if secret is configured
  if (settings.secret) {
    headers['X-Webhook-Signature'] = `sha256=${signPayload(body, settings.secret)}`
  }

  let lastError = ''
  const maxAttempts = (settings.retries || 0) + 1

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), settings.timeoutMs || 10000)

      const res = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (res.ok) {
        return { success: true, status: res.status }
      }

      lastError = `HTTP ${res.status}: ${res.statusText}`
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown error'
    }

    // Exponential backoff before retry
    if (attempt < maxAttempts) {
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500))
    }
  }

  console.error(`[webhook] Failed to deliver ${payload.event} to ${endpoint.name}: ${lastError}`)
  return { success: false, error: lastError }
}

// ─── Public API ───

/**
 * Fire a webhook event. This is non-blocking — it won't slow down your API response.
 * Call this after the main business logic succeeds.
 */
export function emitWebhookEvent(event: WebhookEventType, data: Record<string, unknown>): void {
  // Fire and forget — don't await, don't block the response
  _dispatchEvent(event, data).catch(err => {
    console.error(`[webhook] Dispatch error for ${event}:`, err)
  })
}

async function _dispatchEvent(event: WebhookEventType, data: Record<string, unknown>): Promise<void> {
  const settings = loadSettings()

  if (!settings.enabled) return
  if (!settings.endpoints?.length) return

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  }

  // Send to all active endpoints subscribed to this event
  const targets = settings.endpoints.filter(ep => ep.active && ep.url && ep.events.includes(event))

  if (!targets.length) return

  const results = await Promise.allSettled(
    targets.map(ep => deliverWebhook(ep, payload, settings))
  )

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status === 'rejected') {
      console.error(`[webhook] Unhandled error delivering to ${targets[i].name}:`, result.reason)
    }
  }
}

/**
 * Get the configured low stock threshold.
 */
export function getLowStockThreshold(): number {
  const settings = loadSettings()
  return settings.lowStockThreshold || 20
}
