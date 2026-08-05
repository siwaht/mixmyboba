'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/lib/cartStore'
import { parseCartItemId } from '@/lib/pricing'

interface QuoteLine {
  cartItemId: string
  productId: string
  variantId: string | null
  name: string
  quantity: number
  basePrice: number
  unitPrice: number
  lineTotal: number
  purchaseType: 'subscribe' | 'onetime'
}

interface Quote {
  lines: QuoteLine[]
  totals: {
    subtotal: number
    baseSubtotal: number
    promoDiscount: number
    discount: number
    shipping: number
    tax: number
    total: number
    freeShippingThreshold: number
    amountToFreeShipping: number
  }
  coupon: { code: string; type: string; value: number; discount: number } | null
  couponError: string | null
  stockIssues: { cartItemId: string; name: string; requested: number; available: number }[]
  currency: string
}

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore()
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  // Captured from the created order so the confirmation screen states the amount
  // actually charged, and can hand the email to the guest order lookup.
  const [orderTotal, setOrderTotal] = useState<number | null>(null)
  const [orderEmail, setOrderEmail] = useState('')
  const [error, setError] = useState('')
  const [availableMethods, setAvailableMethods] = useState<{ value: string; label: string }[]>([])
  const [methodsLoading, setMethodsLoading] = useState(true)

  // Server-priced quote — the single source of truth for every amount shown here.
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(true)
  const [quoteError, setQuoteError] = useState('')

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [activeCouponCode, setActiveCouponCode] = useState('')

  // Terms acceptance — use ref to prevent re-render resets
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

  // The cart lines reduced to what the pricing endpoint needs. Serialised so the
  // quote only refetches when the contents actually change, not on every render.
  const quotePayloadItems = useMemo(
    () =>
      items.map(i => {
        const { productId, variantId } = parseCartItemId(i.productId)
        return { productId, variantId, quantity: i.quantity, purchaseType: i.purchaseType }
      }),
    [items]
  )
  const quoteKey = JSON.stringify(quotePayloadItems)

  // ─── Ask the server to price the cart ───
  useEffect(() => {
    if (quotePayloadItems.length === 0) {
      setQuote(null)
      setQuoteLoading(false)
      return
    }

    let cancelled = false
    setQuoteLoading(true)

    // Debounced: email feeds per-customer coupon limits and changes as the user types.
    const timer = setTimeout(() => {
      fetch('/api/checkout/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: quotePayloadItems,
          couponCode: activeCouponCode || undefined,
          email: email.trim() || undefined,
        }),
      })
        .then(async res => {
          const data = await res.json()
          if (cancelled) return
          if (!res.ok) {
            setQuoteError(data.error || 'We could not price your cart. Please refresh.')
            setQuote(null)
            return
          }
          setQuoteError('')
          setQuote(data as Quote)
        })
        .catch(() => {
          if (!cancelled) setQuoteError('We could not price your cart. Please refresh.')
        })
        .finally(() => {
          if (!cancelled) setQuoteLoading(false)
        })
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  // quoteKey stands in for quotePayloadItems (stable string identity)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey, activeCouponCode, email])

  const totals = quote?.totals
  const currencyFmt = (value: number) => `$${value.toFixed(2)}`

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase()
    if (!code) return
    setActiveCouponCode(code)
  }

  const removeCoupon = () => {
    setActiveCouponCode('')
    setCouponCode('')
  }

  if (orderId) {
    return (
      <section className="checkout-section">
        <div className="container checkout-success">
          <div className="success-icon" aria-hidden="true">✓</div>
          <h1>Order Confirmed</h1>
          <p className="success-order-id">Order <code>{orderId}</code></p>
          <p className="success-msg">
            {orderTotal != null && <>You paid <strong>{currencyFmt(orderTotal)}</strong>. </>}
            Your order is being processed. Check your email for confirmation and tracking details.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href={`/account/orders/${orderId}?email=${encodeURIComponent(orderEmail)}`}
              className="btn btn-primary"
            >
              View Order Details
            </Link>
            <Link href="/shop" className="btn btn-secondary">Continue Shopping</Link>
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
          <Link href="/shop" className="btn btn-primary">Browse Flavors</Link>
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
          // Only send a code the server already confirmed applies, so submission
          // can't fail on a code the customer never saw accepted.
          couponCode: quote?.coupon?.code || undefined,
          items: quotePayloadItems,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to place order')
      }
      const order = await res.json()
      setOrderId(order.id)
      setOrderTotal(typeof order.total === 'number' ? order.total : null)
      setOrderEmail(order.email || currentEmail.trim().toLowerCase())
      clearCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const stockIssues = quote?.stockIssues ?? []
  const canSubmit =
    !submitting &&
    termsAccepted &&
    availableMethods.length > 0 &&
    !!totals &&
    !quoteLoading &&
    stockIssues.length === 0

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
              <input ref={phoneRef} type="tel" value={phone} onChange={e => { setPhone(e.target.value); setFieldErrors(prev => ({ ...prev, phone: undefined })) }} onBlur={syncFieldOnBlur('phone')} onInput={e => { const val = (e.target as HTMLInputElement).value; if (val !== phone) { setPhone(val); setFieldErrors(prev => ({ ...prev, phone: undefined })) } }} className={`form-input${fieldErrors.phone ? ' input-error' : ''}`} placeholder="Your phone number" autoComplete="tel" required={paymentMethod === 'cod'} />
              {fieldErrors.phone && <span className="field-error" role="alert">{fieldErrors.phone}</span>}
            </label>
            <label className="form-label">
              Payment Method
              {methodsLoading ? (
                <select className="form-input" disabled aria-busy="true"><option value="">Loading methods...</option></select>
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

            {/* Terms acceptance */}
            <div className="checkout-verifications">
              <label className="checkbox-label">
                <input ref={termsRef} type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} />
                <span>I accept the <a href="/compliance" target="_blank" rel="noopener noreferrer">Terms of Service</a> and return policy.</span>
              </label>
            </div>

            {error && <p className="checkout-error" role="alert" aria-live="assertive">{error}</p>}
            {quoteError && <p className="checkout-error" role="alert" aria-live="assertive">{quoteError}</p>}
            {stockIssues.map(issue => (
              <p key={issue.cartItemId} className="checkout-error" role="alert" aria-live="assertive">
                {issue.available > 0
                  ? `Only ${issue.available} left of ${issue.name} — please lower the quantity in your cart.`
                  : `${issue.name} just sold out. Please remove it from your cart.`}
              </p>
            ))}
            <button type="submit" className="btn btn-primary checkout-submit" disabled={!canSubmit}>
              {submitting
                ? 'Processing...'
                : quoteLoading || !totals
                  ? 'Calculating total...'
                  : `Place Order — ${currencyFmt(totals.total)}`}
            </button>
          </form>

          <div className="checkout-sidebar">
            <div className="checkout-summary glass" aria-busy={quoteLoading}>
              <h3>Summary</h3>
              <div className="checkout-items-list">
                {(quote?.lines ?? []).map(line => (
                  <div key={line.cartItemId} className="checkout-item">
                    <span className="checkout-item-name">
                      {line.name} <span className="checkout-item-qty">× {line.quantity}</span>
                      <span className={`cart-purchase-badge ${line.purchaseType === 'subscribe' ? 'cart-badge-subscribe' : 'cart-badge-onetime'}`}>
                        {line.purchaseType === 'subscribe' ? '🔄 Subscribe' : '🛒 One-time'}
                      </span>
                    </span>
                    <span>{currencyFmt(line.lineTotal)}</span>
                  </div>
                ))}
                {!quote && quoteLoading && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Pricing your cart...</p>
                )}
              </div>

              {/* Coupon section */}
              <div className="coupon-section">
                {quote?.coupon ? (
                  <div className="coupon-applied">
                    <span className="coupon-tag">🏷️ {quote.coupon.code} ({quote.coupon.type === 'percent' ? `${quote.coupon.value}%` : `$${quote.coupon.value}`} off)</span>
                    <button type="button" className="coupon-remove" onClick={removeCoupon} aria-label="Remove coupon">✕</button>
                  </div>
                ) : (
                  <div className="coupon-input-row">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon() } }}
                      placeholder="Coupon code"
                      className="coupon-input"
                      aria-label="Coupon code"
                    />
                    <button type="button" className="btn btn-secondary coupon-apply-btn" onClick={applyCoupon} disabled={!couponCode.trim() || quoteLoading}>
                      {quoteLoading && activeCouponCode ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                {quote?.couponError && (
                  <div className={`coupon-error-alert${quote.couponError.toLowerCase().includes('email') ? ' coupon-error-highlight' : ''}`} role="alert" aria-live="assertive">
                    <span className="coupon-error-icon">⚠️</span>
                    <span>{quote.couponError}{quote.couponError.toLowerCase().includes('email') ? ' — please fill in your email above first.' : ''}</span>
                  </div>
                )}
              </div>

              {totals && (
                <div className="checkout-totals">
                  {totals.promoDiscount > 0 && (
                    <div className="checkout-subtotal-row">
                      <span>Retail</span>
                      <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)' }}>
                        {currencyFmt(totals.baseSubtotal)}
                      </span>
                    </div>
                  )}
                  <div className="checkout-subtotal-row">
                    <span>Subtotal</span>
                    <span>{currencyFmt(totals.subtotal)}</span>
                  </div>
                  {totals.promoDiscount > 0 && (
                    <div className="checkout-discount-row">
                      <span>Bundle savings</span>
                      <span>-{currencyFmt(totals.promoDiscount)}</span>
                    </div>
                  )}
                  {totals.discount > 0 && (
                    <div className="checkout-discount-row">
                      <span>Coupon</span>
                      <span>-{currencyFmt(totals.discount)}</span>
                    </div>
                  )}
                  <div className="checkout-subtotal-row">
                    <span>Shipping</span>
                    <span>
                      {totals.shipping === 0
                        ? <span style={{ color: 'var(--success, #22c55e)' }}>Free</span>
                        : currencyFmt(totals.shipping)}
                    </span>
                  </div>
                  {totals.tax > 0 && (
                    <div className="checkout-subtotal-row">
                      <span>Tax</span>
                      <span>{currencyFmt(totals.tax)}</span>
                    </div>
                  )}
                  {totals.amountToFreeShipping > 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                      Add {currencyFmt(totals.amountToFreeShipping)} more for free shipping.
                    </p>
                  )}
                  <div className="checkout-total">
                    <span>Total</span>
                    <span>{currencyFmt(totals.total)}</span>
                  </div>
                </div>
              )}
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
