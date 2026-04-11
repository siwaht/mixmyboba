import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { safeJson, isErrorResponse } from '@/lib/safe-json'

const SETTINGS_PATH = join(process.cwd(), 'auto-tag-settings.json')

interface AutoTagRule {
  id: string
  name: string
  condition: 'stock_below' | 'sold_above'
  threshold: number
  period?: string
  tagSlug: string
  enabled: boolean
}

interface AutoTagSettings {
  enabled: boolean
  rules: AutoTagRule[]
}

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

function loadSettings(): AutoTagSettings {
  if (!existsSync(SETTINGS_PATH)) {
    return { enabled: false, rules: [] }
  }
  const raw = readFileSync(SETTINGS_PATH, 'utf-8')
  return JSON.parse(raw)
}

function saveSettings(settings: AutoTagSettings) {
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8')
}

// GET — return current auto-tag settings
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = loadSettings()
  return NextResponse.json(settings)
}

// PUT — save updated settings
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await safeJson(req)
    if (isErrorResponse(body)) return body
    const settings: AutoTagSettings = {
      enabled: Boolean((body as Record<string, unknown>).enabled),
      rules: Array.isArray((body as Record<string, unknown>).rules) ? (body as Record<string, unknown>).rules as AutoTagRule[] : [],
    }
    saveSettings(settings)
    return NextResponse.json({ success: true, settings })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}

// POST — run auto-tag rules
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body
  if ((body as Record<string, unknown>).action !== 'run') {
    return NextResponse.json({ error: 'Invalid action. Use { "action": "run" }' }, { status: 400 })
  }

  const settings = loadSettings()
  if (!settings.enabled) {
    return NextResponse.json({ message: 'Auto-tagging is disabled', tagged: 0 })
  }

  const summary: { ruleId: string; ruleName: string; tagged: number }[] = []
  let totalTagged = 0

  for (const rule of settings.rules) {
    if (!rule.enabled) continue

    let tagged = 0

    if (rule.condition === 'stock_below') {
      tagged = await applyStockBelowRule(rule)
    } else if (rule.condition === 'sold_above') {
      tagged = await applySoldAboveRule(rule)
    }

    summary.push({ ruleId: rule.id, ruleName: rule.name, tagged })
    totalTagged += tagged
  }

  return NextResponse.json({ message: `Auto-tagging complete`, totalTagged, summary })
}

// --- Rule executors ---

async function applyStockBelowRule(rule: AutoTagRule): Promise<number> {
  const result = await prisma.product.updateMany({
    where: {
      stock: { lt: rule.threshold },
      tag: null,
      active: true,
    },
    data: { tag: rule.tagSlug },
  })
  return result.count
}

async function applySoldAboveRule(rule: AutoTagRule): Promise<number> {
  // Build the date filter for the period
  const dateFilter = parsePeriod(rule.period)

  // Group OrderItems by productId, summing quantities within the period
  const salesData = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    where: dateFilter
      ? { order: { createdAt: { gte: dateFilter } } }
      : undefined,
  })

  // Filter to products that exceed the threshold
  const qualifyingProductIds = salesData
    .filter((row) => (row._sum.quantity ?? 0) >= rule.threshold)
    .map((row) => row.productId)

  if (qualifyingProductIds.length === 0) return 0

  // Only tag products that don't already have a tag
  const result = await prisma.product.updateMany({
    where: {
      id: { in: qualifyingProductIds },
      tag: null,
      active: true,
    },
    data: { tag: rule.tagSlug },
  })

  return result.count
}

function parsePeriod(period?: string): Date | null {
  if (!period || period === 'all') return null

  const match = period.match(/^(\d+)d$/)
  if (!match) return null

  const days = parseInt(match[1], 10)
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}
