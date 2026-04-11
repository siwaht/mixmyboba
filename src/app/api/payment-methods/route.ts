import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const SETTINGS_PATH = join(process.cwd(), 'payment-settings.json')

export async function GET() {
  let settings: Record<string, unknown> = {}
  try {
    if (existsSync(SETTINGS_PATH)) {
      settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'))
    }
  } catch {
    // fall through with empty settings
  }

  const methods: { value: string; label: string }[] = []

  const s = settings as {
    stripe?: { enabled?: boolean }
    paypal?: { enabled?: boolean }
    crypto?: { enabled?: boolean }
    ach?: { enabled?: boolean }
    cod?: { enabled?: boolean }
  }

  if (s.stripe?.enabled) methods.push({ value: 'card', label: 'Credit Card (Stripe)' })
  if (s.paypal?.enabled) methods.push({ value: 'paypal', label: 'PayPal' })
  if (s.crypto?.enabled) methods.push({ value: 'crypto', label: 'Cryptocurrency (BTC / ETH / USDT)' })
  if (s.ach?.enabled) methods.push({ value: 'ach', label: 'ACH / E-Check' })
  if (s.cod?.enabled) methods.push({ value: 'cod', label: 'Cash on Delivery' })

  return NextResponse.json(methods)
}
