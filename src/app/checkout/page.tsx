'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/lib/cartStore'

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore()
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
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

  // Age verification — use ref to prevent re-render resets
  const [termsAccepted, setTermsAccepted] = useState(false)
  const termsRef = useRef<HTMLInputElement>(null)

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; address?: string; phone?: string }>({})

  // Refs for syncing programmatic/autofill input with React state
  const emailRef = useRef<HTMLInputElement>(null)
  const addressRef = useRef<HTMLTextAreaElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)

  // Sync DOM values to React state on blur (catches autofill/paste that skips onChange)
  const syncFieldOnBlur = useCallback((field: 'email' | 'address' | 'phone') => {
    return () => {
      if (field === 'email' && emailRef.current && emailRef.current.value !== email) {
        setEmail(emailRef.current.value)
        setFieldErrors(prev => ({ ...prev, email: undefined }))
      } else if (field === 'address' && addressRef.current && addressRef.current.value !== address) {
        setAddress(addressRef.current.value)
        setFieldErrors(prev => ({ ...prev, address: undefined }))
      } else if (field === 'phone' && phoneRef.current && phoneRef.current.value !== phone) {
        setPhone(phoneRef.current.value)
        setFieldErrors(prev => ({ ...prev, phone: undefined }))
      }
    }
  }, [email, address, phone])

  // Periodically sync DOM values to catch autofill that doesn't fire any events
  useEffect(() => {
    const interval = setInterval(() => {
      if (emailRef.current && emailRef.current.value !== email) {
        setEmail(emailRef.current.value)
      }
      if (addressRef.current && addressRef.current.value !== address) {
        setAddress(addressRef.current.value)
      }
      if (phoneRef.current && phoneRef.current.value !== phone) {
        setPhone(phoneRef.current.value)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [email, address, phone])

  // Pre-fill email from logged-in user (skip admin accounts)
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user?.email && data.user?.role !== 'admin' && !email) {
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
  const shipping = subtotal >= 50 ? 0 : 5.99
  const total = subtotal + shipping - discount

  const applyCoupon = async () => {
    setCouponError('')
    setCouponLoading(true)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal, email }),
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
            Your order is being processed. Check your email for confirmation and tracking details.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/account/orders/${orderId}`} className="btn btn-primary">View Order Details</Link>
            <Link href="/" className="btn btn-secondary">Continue Shopping</Link>
          </div>
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="checkout-section">
        <div className="container checkout-empty">
          <div className="empty-icon" aria-hidden="true">🧋</div>
          <h1>Your Cart is Empty</h1>
          <p>Looks like you haven&apos;t picked any flavors yet!</p>
          <Link href="/#store" className="btn btn-primary">Browse Flavors</Link>
        </div>
      </section>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Sync DOM values to state before validation (catches autofill/paste that skipped onChange)
    const currentEmail = emailRef.current?.value ?? email
    const currentAddress = addressRef.current?.value ?? address
    const currentPhone = phoneRef.current?.value ?? phone
    const currentTerms = termsRef.current?.checked ?? termsAccepted

    // Update state to match DOM
    if (currentEmail !== email) setEmail(currentEmail)
    if (currentAddress !== address) setAddress(currentAddress)
    if (currentPhone !== phone) setPhone(currentPhone)
    if (currentTerms !== termsAccepted) setTermsAccepted(currentTerms)

    const errors: { email?: string; address?: string; phone?: string } = {}
    if (!currentEmail.trim()) errors.email = 'Email is required.'
    if (!currentAddress.trim()) errors.address = 'Shipping address is required.'
    else if (currentAddress.trim().length < 10) errors.address = 'Please provide a full shipping address (at least 10 characters).'
    if (paymentMethod === 'cod' && !currentPhone.trim()) errors.phone = 'Phone number is required for Cash on Delivery.'
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    if (!currentTerms) {
      setError('Please accept the Terms of Service to continue.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentEmail,
          shippingAddress: currentAddress,
          phone: currentPhone.trim() || undefined,
          paymentMethod,
          notes,
          couponCode: appliedCoupon?.code || undefined,
          items: items.map(i => {
            const [baseId, ...rest] = i.productId.split('__')
            return {
              productId: baseId,
              quantity: i.quantity,
              variantLabel: rest.length > 0 ? i.name.replace(/^.*\((.+)\)$/, '$1') : undefined,
            }
          }),
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
              <input ref={emailRef} type="email" required value={email} onChange={e => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: undefined })) }} onBlur={syncFieldOnBlur('email')} onInput={e => { const val = (e.target as HTMLInputElement).value; if (val !== email) { setEmail(val); setFieldErrors(prev => ({ ...prev, email: undefined })) } }} className={`form-input${fieldErrors.email ? ' input-error' : ''}`} placeholder="you@example.com" autoComplete="email" />
              {fieldErrors.email && <span className="field-error" role="alert">{fieldErrors.email}</span>}
            </label>
            <label className="form-label">
              Shipping Address
              <textarea ref={addressRef} required value={address} onChange={e => { setAddress(e.target.value); setFieldErrors(prev => ({ ...prev, address: undefined })) }} onBlur={syncFieldOnBlur('address')} onInput={e => { const val = (e.target as HTMLTextAreaElement).value; if (val !== address) { setAddress(val); setFieldErrors(prev => ({ ...prev, address: undefined })) } }} className={`form-input${fieldErrors.address ? ' input-error' : ''}`} rows={3} placeholder="Full shipping address" autoComplete="street-address" minLength={10} />
              {fieldErrors.address && <span className="field-error" role="alert">{fieldErrors.address}</span>}
            </label>
            <label className="form-label">
              Phone Number {paymentMethod === 'cod' ? '(required)' : '(optional)'}
              <input ref={phoneRef} type="tel" value={phone} onChange={e => { setPhone(e.target.value); setFieldErrors(prev => ({ ...prev, phone: undefined })) }} onBlur={syncFieldOnBlur('phone')} onInput={e => { const val = (e.target as HTMLInputElement).value; if (val !== phone) { setPhone(val); setFieldErrors(prev => ({ ...prev, phone: undefined })) } }} className={`form-input${fieldErrors.phone ? ' input-error' : ''}`} placeholder="+1 (555) 123-4567" autoComplete="tel" required={paymentMethod === 'cod'} />
              {fieldErrors.phone && <span className="field-error" role="alert">{fieldErrors.phone}</span>}
            </label>
            <label className="form-label">
              Payment Method
              {methodsLoading ? (
                <select className="form-input" disabled aria-busy="true"><option value="">Loading methods...</option></select>
              ) : availableMethods.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0' }}>No payment methods are currently available. Please try again later.</p>
              ) : (
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="form-input" disabled={false}>
                  {availableMethods.map(m => (
                    <option key={m.value} value={m.value} disabled={false}>{m.label}</option>
                  ))}
                </select>
              )}
            </label>
            <label className="form-label">
              Order Notes (optional)
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="form-input" rows={2} placeholder="Special instructions..." />
            </label>

            {/* Terms acceptance */}
            <div className="checkout-verifications">
              <label className="checkbox-label">
                <input ref={termsRef} type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} />
                <span>I accept the <a href="/compliance" target="_blank" rel="noopener noreferrer">Terms of Service</a> and return policy.</span>
              </label>
            </div>

            {error && <p className="checkout-error" role="alert" aria-live="assertive">{error}</p>}
            <button type="submit" className="btn btn-primary checkout-submit" disabled={submitting || !termsAccepted || availableMethods.length === 0}>
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
                <div className="checkout-subtotal-row">
                  <span>Shipping</span>
                  <span>{subtotal >= 50 ? <span style={{ color: 'var(--success, #22c55e)' }}>Free</span> : '$5.99'}</span>
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
              <span>🔒 Secure Checkout</span>
              <span>📦 Fast Shipping</span>
              <span>💜 Happiness Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
