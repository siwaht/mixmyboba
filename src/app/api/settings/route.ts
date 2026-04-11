import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

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

export async function GET() {
  if (!existsSync(SETTINGS_PATH)) {
    return NextResponse.json(DEFAULT_SETTINGS)
  }
  const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'))
  return NextResponse.json(settings)
}
