'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ComplianceBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (sessionStorage.getItem('banner-dismissed') === '1') {
      setDismissed(true)
    }
  }, [])

  if (!mounted || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('banner-dismissed', '1')
  }

  return (
    <div className="compliance-banner" role="banner">
      <div className="container compliance-banner-inner">
        <span>
          🧬 <strong>Free shipping</strong> on orders over $150 — use code <strong>PEPTIDE15</strong> for 15% off your first order!{' '}
          <Link href="/#store">Shop now →</Link>
        </span>
        <button
          className="compliance-banner-close"
          onClick={handleDismiss}
          aria-label="Dismiss banner"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
