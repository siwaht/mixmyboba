'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'

interface AnnouncementSettings {
  announcement: string
  announcementLink?: string
  announcementLinkText?: string
}

function useClientMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

function getInitialDismissed() {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem('banner-dismissed') === '1'
}

export default function ComplianceBanner() {
  const [dismissed, setDismissed] = useState(getInitialDismissed)
  const mounted = useClientMounted()
  const [settings, setSettings] = useState<AnnouncementSettings | null>(null)

  useEffect(() => {
    if (dismissed) return
    fetch('/api/settings')
      .then(r => r.json())
      .then((data: AnnouncementSettings) => setSettings(data))
      .catch(() => {})
  }, [dismissed])

  if (!mounted || dismissed) return null
  if (!settings || !settings.announcement) return null

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('banner-dismissed', '1')
  }

  return (
    <div className="compliance-banner" role="banner">
      <div className="container compliance-banner-inner">
        <span>
          🧋 {settings.announcement}
          {settings.announcementLink && (
            <>
              {' '}
              <Link href={settings.announcementLink}>
                {settings.announcementLinkText || 'Learn more →'}
              </Link>
            </>
          )}
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
