'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/lib/cartStore'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore()
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape, trap focus inside the drawer, and restore focus on close
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeBtnRef.current?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div
        className="cart-drawer"
        ref={drawerRef}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <div className="cart-header">
          <h3 id="cart-drawer-title">Cart{itemCount > 0 ? ` (${itemCount})` : ''}</h3>
          <button ref={closeBtnRef} onClick={onClose} className="cart-close-btn" aria-label="Close cart">✕</button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-icon" aria-hidden="true">🧋</span>
            <p>Your cart is empty</p>
            <Link href="/#store" className="btn btn-secondary" onClick={onClose}>Browse Flavors</Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(item => (
                <div key={item.productId} className="cart-item">
                  <Image src={item.imageUrl} alt="" className="cart-item-img" width={52} height={52} loading="lazy" />
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    {item.purchaseType && (
                      <span className={`cart-purchase-badge ${item.purchaseType === 'subscribe' ? 'cart-badge-subscribe' : 'cart-badge-onetime'}`}>
                        {item.purchaseType === 'subscribe' ? '🔄 Subscribe' : '🛒 One-time'}
                      </span>
                    )}
                    <p className="cart-item-price">
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="cart-item-original-price">${(item.originalPrice * item.quantity).toFixed(2)}</span>
                      )}
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <div className="cart-qty-controls">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}>−</button>
                      <span aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}>+</button>
                    </div>
                  </div>
                  <button className="cart-remove-btn" onClick={() => removeItem(item.productId)} aria-label={`Remove ${item.name} from cart`}>✕</button>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total">
                <span>Total</span>
                <span>${totalPrice().toFixed(2)}</span>
              </div>
              <Link href="/checkout" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }} onClick={onClose}>
                Checkout
              </Link>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.6rem' }}
                onClick={clearCart}
              >
                Clear Cart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
