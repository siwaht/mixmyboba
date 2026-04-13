'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * Catch-all route for /admin/* sub-paths.
 * The admin panel uses client-side tab switching on /admin,
 * so direct navigation to /admin/orders etc. would 404.
 * This redirects to /admin with the tab encoded as a hash.
 */
export default function AdminCatchAll() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Extract the tab name from the path, e.g. /admin/orders -> orders
    const segments = pathname.replace(/^\/admin\/?/, '').split('/')
    const tab = segments[0] || 'dashboard'
    router.replace(`/admin#${tab}`)
  }, [pathname, router])

  return (
    <section style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
      Redirecting to admin dashboard...
    </section>
  )
}
