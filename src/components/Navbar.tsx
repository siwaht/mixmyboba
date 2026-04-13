'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ShoppingCart, X } from 'lucide-react'
import { useCartStore } from '@/lib/cartStore'
import CartDrawer from './CartDrawer'
import ThemeToggle from './ThemeToggle'

interface NavLink { label: string; href: string }

export default function Navbar() {
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const itemCount = useCartStore(s => s.itemCount)
  const [navLinks, setNavLinks] = useState<NavLink[]>([
    { label: 'Shop', href: '/#store' },
    { label: 'Our Story', href: '/about' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Compare', href: '/compare' },
  ])
  const [logoEmoji, setLogoEmoji] = useState('🧋')
  const [logoText, setLogoText] = useState('mix my boba')

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })

    // Auto-open cart drawer if redirected from /cart
    if (sessionStorage.getItem('open-cart')) {
      sessionStorage.removeItem('open-cart')
      setCartOpen(true)
    }

    fetch('/api/page-content')
      .then(r => r.json())
      .then(data => {
        if (data.navbar) {
          if (Array.isArray(data.navbar.links) && data.navbar.links.length) setNavLinks(data.navbar.links)
          if (data.navbar.logoEmoji) setLogoEmoji(data.navbar.logoEmoji)
          if (data.navbar.logoText) setLogoText(data.navbar.logoText)
        }
      })
      .catch(() => {})

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
            <Link href="/" className="logo" aria-label="Homepage">
              <span className="logo-emoji">{logoEmoji}</span> <span>{logoText.split(' ').slice(0, -1).join(' ')}</span> {logoText.split(' ').slice(-1)[0]}
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
              {navLinks.map((link, i) => (
                <Link key={i} href={link.href} onClick={closeMenu}>{link.label}</Link>
              ))}
            </div>
          </div>

          <div className="nav-right">
            <ThemeToggle />
            <Link href="/account" className="nav-account-link">Account</Link>
            <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${mounted ? itemCount : 0} items`}>
              <ShoppingCart size={18} strokeWidth={1.5} aria-hidden="true" />
              <span className="cart-badge" aria-hidden="true">{mounted ? itemCount : 0}</span>
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
