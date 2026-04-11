'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/lib/cartStore'

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore()
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [availableMethods, setAvailableMethods] = useState<{ value: string; label: string }[]>([])
  const [methodsLoading, setMethodsLoading] = useState(true)

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; type: string; value: number } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  // Age verification
  const [ageVerified, setAgeVerified] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Pre-fill email from logged-in user
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user?.email && !email) {
          setEmail(data.user.email)
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch enabled payment methods from admin settings
  useEffect(() => {
    setMethodsLoading(true)
    fetch('/api/payment-methods')
      .then(r => r.json())
      .then((methods: { value: string; label: string }[]) => {
        setAvailableMethods(methods)
        if (methods.length > 0 && !methods.find(m => m.value === paymentMethod)) {
          setPaymentMethod(methods[0].value)
        }
      })
      .catch(() => setAvailableMethods([]))
      .finally(() => setMethodsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const subtotal = totalPrice()
  const discount = appliedCoupon?.discount || 0
  const total = subtotal - discount

  const applyCoupon = async () => {
    setCouponError('')
    setCouponLoading(true)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCouponError(data.error)
        setAppliedCoupon(null)
      } else {
        setAppliedCoupon(data)
        setCouponError('')
      }
    } catch {
      setCouponError('Failed to validate coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  if (orderId) {
    return (
      <section className="checkout-section">
        <div className="container checkout-success">
          <div className="success-icon" aria-hidden="true">✓</div>
          <h1>Order Confirmed</h1>
          <p className="success-order-id">Order <code>{orderId}</code></p>
          <p className="success-msg">
            {paymentMethod === 'crypto'
              ? 'Send payment to the crypto address in your confirmation email. Your order ships once payment confirms.'
              : paymentMethod === 'cod'
              ? 'Your order has been placed. Please have cash ready when the delivery arrives.'
              : 'Your order is being processed. Check your email for confirmation.'}
          </p>
          <Link href="/" className="btn btn-primary">Continue Shopping</Link>
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="checkout-section">
        <div className="container checkout-empty">
          <div className="empty-icon" aria-hidden="true">🛒</div>
          <h1>Cart is Empty</h1>
          <p>Add some products before checking out.</p>
          <Link href="/#store" className="btn btn-primary">Browse Products</Link>
        </div>
      </section>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ageVerified || !termsAccepted) {
      setError('Please confirm age verification and accept terms.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          shippingAddress: address,
          paymentMethod,
          notes,
          couponCode: appliedCoupon?.code || null,
          items: items.map(i => ({ productId: i.productId.split('__')[0], quantity: i.quantity })),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to place order')
      }
      const order = await res.json()
      setOrderId(order.id)
      clearCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="checkout-section">
      <div className="container" style={{ maxWidth: 920 }}>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)' }}>Checkout</span>
        </nav>
        <h1 style={{ marginBottom: '2rem' }}>Checkout</h1>
        <div className="checkout-grid">
          <form onSubmit={handleSubmit} className="checkout-form glass">
            <h3>Shipping Details</h3>
            <label className="form-label">
              Email
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="form-input" placeholder="researcher@lab.edu" autoComplete="email" />
            </label>
            <label className="form-label">
              Shipping Address
              <textarea required value={address} onChange={e => setAddress(e.target.value)} className="form-input" rows={3} placeholder="Full shipping address" autoComplete="street-address" />
            </label>
            <label className="form-label">
              Payment Method
              {methodsLoading ? (
                <select className="form-input" disabled><option>Loading methods...</option></select>
              ) : availableMethods.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0' }}>No payment methods are currently available. Please try again later.</p>
              ) : (
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="form-input">
                  {availableMethods.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              )}
            </label>
            <label className="form-label">
              Order Notes (optional)
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="form-input" rows={2} placeholder="Special instructions..." />
            </label>

            {/* Verification checkboxes */}
            <div className="checkout-verifications">
              <label className="checkbox-label">
                <input type="checkbox" checked={ageVerified} onChange={e => setAgeVerified(e.target.checked)} />
                <span>I confirm I am at least 18 years of age.</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} />
                <span>I accept the <a href="/compliance" target="_blank" rel="noopener noreferrer">Terms of Service</a> and confirm these products are for research use only.</span>
              </label>
            </div>

            {error && <p className="checkout-error" role="alert" aria-live="assertive">{error}</p>}
            <button type="submit" className="btn btn-primary checkout-submit" disabled={submitting || !ageVerified || !termsAccepted || availableMethods.length === 0}>
              {submitting ? 'Processing...' : `Place Order — $${total.toFixed(2)}`}
            </button>
          </form>

          <div className="checkout-sidebar">
            <div className="checkout-summary glass">
              <h3>Summary</h3>
              <div className="checkout-items-list">
                {items.map(item => (
                  <div key={item.productId} className="checkout-item">
                    <span className="checkout-item-name">{item.name} <span className="checkout-item-qty">× {item.quantity}</span></span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon section */}
              <div className="coupon-section">
                {appliedCoupon ? (
                  <div className="coupon-applied">
                    <span className="coupon-tag">🏷️ {appliedCoupon.code} ({appliedCoupon.type === 'percent' ? `${appliedCoupon.value}%` : `$${appliedCoupon.value}`} off)</span>
                    <button type="button" className="coupon-remove" onClick={removeCoupon}>✕</button>
                  </div>
                ) : (
                  <div className="coupon-input-row">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      placeholder="Coupon code"
                      className="coupon-input"
                    />
                    <button type="button" className="btn btn-secondary coupon-apply-btn" onClick={applyCoupon} disabled={!couponCode.trim() || couponLoading}>
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && <p className="coupon-error" role="alert" aria-live="polite">{couponError}</p>}
              </div>

              <div className="checkout-totals">
                <div className="checkout-subtotal-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="checkout-discount-row">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="checkout-total">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="checkout-trust-badges">
              <span>🔒 Encrypted</span>
              <span>📦 Discreet</span>
              <span>₿ Crypto</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
