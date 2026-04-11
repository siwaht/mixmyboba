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

const SETTINGS_PATH = join(process.cwd(), 'site-settings.json')

const DEFAULT_SETTINGS = {
  hero: {
    title: 'Advance Your Research with',
    titleHighlight: 'Absolute Purity',
    subtitle: 'Third-party tested, structurally verified, laboratory-grade synthetic peptides for cutting-edge biological research.',
    ctaPrimary: { text: 'Browse Catalog', href: '#store' },
    ctaSecondary: { text: 'View COAs', href: '/compliance' },
  },
  trustBadges: [
    { icon: '🔬', label: 'Janoshik Verified' },
    { icon: '📊', label: 'HPLC + Mass Spec' },
    { icon: '🧊', label: 'Cold Chain Shipping' },
    { icon: '📋', label: 'COA Every Batch' },
    { icon: '₿', label: 'Crypto Accepted' },
  ],
  marqueeItems: [
    'HPLC Verified',
    'Mass Spectrometry Tested',
    'Janoshik Analytics Partner',
    'GMP-Grade Sourcing',
    'ISO 9001 Certified',
    'COA on Every Batch',
    'Climate-Controlled Storage',
  ],
  statsBar: [
    { value: '99.8%', label: 'Minimum Purity' },
    { value: '100%', label: 'Third-Party Tested' },
    { value: 'ISO 9001', label: 'Certified Facility' },
    { value: '24h', label: 'Fulfillment' },
  ],
  announcement: '',
}

function getSettings() {
  if (!existsSync(SETTINGS_PATH)) {
    writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2))
    return DEFAULT_SETTINGS
  }
  return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'))
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  return NextResponse.json(getSettings())
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const data = await safeJson(req)
  if (isErrorResponse(data)) return data
  writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2))
  return NextResponse.json(data)
}
