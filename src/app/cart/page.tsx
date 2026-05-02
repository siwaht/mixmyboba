'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSyncExternalStore } from 'react'
import { useCartStore } from '@/lib/cartStore'

function useClientMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

export default function CartPage() {
  const mounted = useClientMounted()
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore()

  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  if (!mounted) {
    return (
      <section className="cart-page">
        <div className="container">
          <h1>Your Cart</h1>
          <div className="cart-page-empty">
            <p>Loading…</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="cart-page">
      <div className="container">
        <h1>Your Cart{itemCount > 0 ? ` (${itemCount})` : ''}</h1>

        {items.length === 0 ? (
          <div className="cart-page-empty">
            <span className="cart-empty-icon" aria-hidden="true">🧋</span>
            <p>Your cart is empty.</p>
            <Link href="/#store" className="btn btn-primary">Browse Flavors</Link>
          </div>
        ) : (
          <div className="cart-page-grid">
            <div className="cart-page-items">
              {items.map(item => (
                <div key={item.productId} className="cart-page-item">
                  <Link href={`/product/${item.slug}`} className="cart-page-item-img-link">
                    <Image src={item.imageUrl} alt={item.name} className="cart-page-item-img" width={96} height={96} loading="lazy" />
                  </Link>
                  <div className="cart-page-item-info">
                    <Link href={`/product/${item.slug}`} className="cart-page-item-name">{item.name}</Link>
                    {item.purchaseType && (
                      <span className={`cart-purchase-badge ${item.purchaseType === 'subscribe' ? 'cart-badge-subscribe' : 'cart-badge-onetime'}`}>
                        {item.purchaseType === 'subscribe' ? '🔄 Subscribe' : '🛒 One-time'}
                      </span>
                    )}
                    <div className="cart-qty-controls">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}>−</button>
                      <span aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}>+</button>
                    </div>
                  </div>
                  <div className="cart-page-item-meta">
                    <p className="cart-page-item-price">
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="cart-item-original-price">${(item.originalPrice * item.quantity).toFixed(2)}</span>
                      )}
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </p>
                    <button
                      className="cart-page-remove"
                      onClick={() => removeItem(item.productId)}
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <aside className="cart-page-summary" aria-label="Order summary">
              <h2>Order Summary</h2>
              <div className="cart-page-summary-row">
                <span>Subtotal</span>
                <span>${totalPrice().toFixed(2)}</span>
              </div>
              <p className="cart-page-summary-note">Shipping and taxes calculated at checkout.</p>
              <Link href="/checkout" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                Checkout
              </Link>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                onClick={clearCart}
              >
                Clear Cart
              </button>
              <Link href="/#store" className="cart-page-continue">← Continue shopping</Link>
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}
