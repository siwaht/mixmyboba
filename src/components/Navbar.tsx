'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ShoppingCart, X } from 'lucide-react'
import { useCartStore } from '@/lib/cartStore'
import CartDrawer from './CartDrawer'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const totalItems = useCartStore(s => s.totalItems)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768 && menuOpen) setMenuOpen(false)
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [menuOpen])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="container">
          <div className="nav-left">
            <Link href="/" className="logo" aria-label="Immortality Peptides homepage">
              <span className="logo-emoji">⚗️</span> <span>immortality</span> peptides
            </Link>
            <div className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
              {menuOpen && (
                <button
                  className="mobile-menu-close"
                  onClick={closeMenu}
                  aria-label="Close menu"
                >
                  <X size={24} strokeWidth={1.5} />
                </button>
              )}
              <Link href="/#store" onClick={closeMenu}>Shop</Link>
              <Link href="/about" onClick={closeMenu}>Science</Link>
              <Link href="/faq" onClick={closeMenu}>FAQ</Link>
              <Link href="/compare" onClick={closeMenu}>Compare</Link>
            </div>
          </div>

          <div className="nav-right">
            <ThemeToggle />
            <Link href="/account" className="nav-account-link">Account</Link>
            <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${mounted ? totalItems() : 0} items`}>
              <ShoppingCart size={18} strokeWidth={1.5} aria-hidden="true" />
              <span className="cart-badge" aria-hidden="true">{mounted ? totalItems() : 0}</span>
            </button>
            <button
              className="hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
              <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
              <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
            </button>
          </div>
        </div>
      </nav>
      {menuOpen && <div className="nav-overlay" onClick={closeMenu} aria-hidden="true" />}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
