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
    title: 'Your daily boba ritual,',
    titleHighlight: 'made ridiculously easy.',
    subtitle: 'Premium instant boba mixes with real tea leaves, zero artificial anything. Just scoop, mix, sip. Boba shop taste in 60 seconds flat.',
    ctaPrimary: { text: 'Shop Flavors', href: '#store' },
    ctaSecondary: { text: 'Our Story', href: '/about' },
  },
  trustBadges: [
    { icon: '🍵', label: 'Real Tea Leaves' },
    { icon: '🌱', label: 'Natural Ingredients' },
    { icon: '⚡', label: 'Ready in 60s' },
    { icon: '💰', label: 'Under $2/Cup' },
    { icon: '🧋', label: '20+ Servings' },
  ],
  marqueeItems: [
    'Real Tea Leaves',
    'No Artificial Flavors',
    'Ready in 60 Seconds',
    'Naturally Sweetened',
    'Boba Shop Taste',
    'Plant-Based Friendly',
    'Under $2 a Cup',
  ],
  statsBar: [
    { value: '20+', label: 'Servings Per Bag' },
    { value: '<$2', label: 'Per Cup' },
    { value: '60s', label: 'Prep Time' },
    { value: '5★', label: 'Avg Rating' },
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
