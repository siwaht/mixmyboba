'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to homepage — the cart is a drawer component, not a standalone page.
    // We set a sessionStorage flag so the Navbar can auto-open the drawer.
    sessionStorage.setItem('open-cart', '1')
    router.replace('/')
  }, [router])

  return (
    <section style={{ padding: '6rem 2rem', textAlign: 'center' }}>
      <p>Redirecting to cart…</p>
    </section>
  )
}
