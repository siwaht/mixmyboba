import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { safeJson, isErrorResponse } from '@/lib/safe-json'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

const SETTINGS_PATH = join(process.cwd(), 'payment-settings.json')

export interface PaymentSettings {
  stripe: {
    enabled: boolean
    testMode: boolean
    publishableKey: string
    secretKey: string
    webhookSecret: string
  }
  paypal: {
    enabled: boolean
    testMode: boolean
    clientId: string
    clientSecret: string
    webhookId: string
  }
  crypto: {
    enabled: boolean
    walletAddress: string
    acceptedCoins: string[]
    network: string
  }
  ach: {
    enabled: boolean
    bankName: string
    routingNumber: string
    accountNumber: string
    accountName: string
  }
  cod: {
    enabled: boolean
    instructions: string
  }
  general: {
    currency: string
    taxRate: number
    freeShippingThreshold: number
  }
}

const DEFAULT_SETTINGS: PaymentSettings = {
  stripe: {
    enabled: false,
    testMode: true,
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
  },
  paypal: {
    enabled: false,
    testMode: true,
    clientId: '',
    clientSecret: '',
    webhookId: '',
  },
  crypto: {
    enabled: true,
    walletAddress: '',
    acceptedCoins: ['BTC', 'ETH', 'USDT', 'USDC'],
    network: 'ERC-20',
  },
  ach: {
    enabled: false,
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    accountName: '',
  },
  cod: {
    enabled: false,
    instructions: 'Pay with cash when your order is delivered to your doorstep.',
  },
  general: {
    currency: 'USD',
    taxRate: 0,
    freeShippingThreshold: 200,
  },
}

function getSettings(): PaymentSettings {
  if (!existsSync(SETTINGS_PATH)) {
    writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2))
    return DEFAULT_SETTINGS
  }
  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'))
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const settings = getSettings()
  // Mask sensitive keys for display
  const masked = {
    ...settings,
    stripe: {
      ...settings.stripe,
      secretKey: settings.stripe.secretKey ? '••••' + settings.stripe.secretKey.slice(-4) : '',
      webhookSecret: settings.stripe.webhookSecret ? '••••' + settings.stripe.webhookSecret.slice(-4) : '',
    },
    paypal: {
      ...settings.paypal,
      clientSecret: settings.paypal.clientSecret ? '••••' + settings.paypal.clientSecret.slice(-4) : '',
    },
    ach: {
      ...settings.ach,
      accountNumber: settings.ach.accountNumber ? '••••' + settings.ach.accountNumber.slice(-4) : '',
      routingNumber: settings.ach.routingNumber ? '••••' + settings.ach.routingNumber.slice(-4) : '',
    },
  }

  return NextResponse.json(masked)
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const data = await safeJson<Partial<PaymentSettings>>(req)
  if (isErrorResponse(data)) return data
  const current = getSettings()

  // Merge: don't overwrite masked values
  const merged: PaymentSettings = {
    stripe: {
      enabled: data.stripe?.enabled ?? current.stripe.enabled,
      testMode: data.stripe?.testMode ?? current.stripe.testMode,
      publishableKey: data.stripe?.publishableKey ?? current.stripe.publishableKey,
      secretKey: data.stripe?.secretKey?.startsWith('••') ? current.stripe.secretKey : (data.stripe?.secretKey ?? current.stripe.secretKey),
      webhookSecret: data.stripe?.webhookSecret?.startsWith('••') ? current.stripe.webhookSecret : (data.stripe?.webhookSecret ?? current.stripe.webhookSecret),
    },
    paypal: {
      enabled: data.paypal?.enabled ?? current.paypal.enabled,
      testMode: data.paypal?.testMode ?? current.paypal.testMode,
      clientId: data.paypal?.clientId ?? current.paypal.clientId,
      clientSecret: data.paypal?.clientSecret?.startsWith('••') ? current.paypal.clientSecret : (data.paypal?.clientSecret ?? current.paypal.clientSecret),
      webhookId: data.paypal?.webhookId ?? current.paypal.webhookId,
    },
    crypto: {
      enabled: data.crypto?.enabled ?? current.crypto.enabled,
      walletAddress: data.crypto?.walletAddress ?? current.crypto.walletAddress,
      acceptedCoins: data.crypto?.acceptedCoins ?? current.crypto.acceptedCoins,
      network: data.crypto?.network ?? current.crypto.network,
    },
    ach: {
      enabled: data.ach?.enabled ?? current.ach.enabled,
      bankName: data.ach?.bankName ?? current.ach.bankName,
      routingNumber: data.ach?.routingNumber?.startsWith('••') ? current.ach.routingNumber : (data.ach?.routingNumber ?? current.ach.routingNumber),
      accountNumber: data.ach?.accountNumber?.startsWith('••') ? current.ach.accountNumber : (data.ach?.accountNumber ?? current.ach.accountNumber),
      accountName: data.ach?.accountName ?? current.ach.accountName,
    },
    cod: {
      enabled: data.cod?.enabled ?? current.cod?.enabled ?? false,
      instructions: data.cod?.instructions ?? current.cod?.instructions ?? 'Pay with cash when your order is delivered to your doorstep.',
    },
    general: {
      currency: data.general?.currency ?? current.general.currency,
      taxRate: data.general?.taxRate ?? current.general.taxRate,
      freeShippingThreshold: data.general?.freeShippingThreshold ?? current.general.freeShippingThreshold,
    },
  }

  writeFileSync(SETTINGS_PATH, JSON.stringify(merged, null, 2))
  return NextResponse.json({ success: true })
}
