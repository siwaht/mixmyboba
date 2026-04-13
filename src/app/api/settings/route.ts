import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const SETTINGS_PATH = join(process.cwd(), 'site-settings.json')

const DEFAULT_SETTINGS = {
  hero: {
    title: 'Boba shop taste,',
    titleHighlight: 'made at home.',
    subtitle: 'Premium instant boba tea mixes crafted with real tea leaves and natural ingredients. Just add water and your favorite milk.',
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
  announcementLink: '',
  announcementLinkText: '',
}

export async function GET() {
  if (!existsSync(SETTINGS_PATH)) {
    return NextResponse.json(DEFAULT_SETTINGS)
  }
  const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'))
  return NextResponse.json(settings)
}
