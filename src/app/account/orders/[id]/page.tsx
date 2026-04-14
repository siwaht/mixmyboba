'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface OrderItem {
  id: string
  quantity: number
  price: number
  variantLabel: string | null
  product: { name: string; slug: string; imageUrl: string }
}

interface Order {
  id: string
  email: string
  status: string
  paymentMethod: string
  shippingAddress: string
  subtotal: number
  shipping: number
  total: number
  discount: number
  couponCode: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

const STATUS_STEPS = ['pending', 'paid', 'shipped', 'delivered']

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r => {
        if (!r.ok) throw new Error(r.status === 403 ? 'You do not have permission to view this order.' : 'Order not found.')
        return r.json()
      })
      .then(setOrder)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <section className="account-section">
        <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div className="loading-spinner" aria-label="Loading order details" />
        </div>
      </section>
    )
  }

  if (error || !order) {
    return (
      <section className="account-section">
        <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <h1>😕 {error || 'Order not found'}</h1>
          <Link href="/account" className="btn btn-secondary" style={{ marginTop: '1rem' }}>Back to Account</Link>
        </div>
      </section>
    )
  }

  const currentStep = order.status === 'cancelled' ? -1 : STATUS_STEPS.indexOf(order.status)
  const paymentLabels: Record<string, string> = {
    cod: 'Cash on Delivery', crypto: 'Cryptocurrency', ach: 'Bank Transfer (ACH)',
    card: 'Credit/Debit Card', paypal: 'PayPal',
  }

  return (
    <section className="account-section">
      <div className="container" style={{ maxWidth: 800, padding: '2rem 1rem' }}>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/account">Account</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)' }}>Order #{order.id.slice(-8)}</span>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', margin: '1.5rem 0' }}>
          <h1 style={{ margin: 0 }}>Order #{order.id.slice(-8)}</h1>
          <span className={`order-status status-${order.status}`} style={{ fontSize: '0.95rem', padding: '0.4rem 1rem' }}>
            {order.status}
          </span>
        </div>

        {/* Status tracker */}
        {order.status !== 'cancelled' && (
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 14, left: '10%', right: '10%', height: 3, background: 'var(--border-color)', borderRadius: 2, zIndex: 0 }} />
              <div style={{ position: 'absolute', top: 14, left: '10%', height: 3, background: 'var(--accent-primary)', borderRadius: 2, zIndex: 1, width: `${Math.max(0, currentStep) / (STATUS_STEPS.length - 1) * 80}%`, transition: 'width 0.5s ease' }} />
              {STATUS_STEPS.map((step, i) => (
                <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 600,
                    background: i <= currentStep ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: i <= currentStep ? '#fff' : 'var(--text-secondary)',
                    border: `2px solid ${i <= currentStep ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    transition: 'all 0.3s ease',
                  }}>
                    {i <= currentStep ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '0.75rem', marginTop: 6, color: i <= currentStep ? 'var(--text-primary)' : 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {order.status === 'cancelled' && (
          <div className="glass" style={{ padding: '1rem 1.5rem', borderRadius: '1rem', marginBottom: '1.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p style={{ margin: 0, color: '#ef4444' }}>This order has been cancelled.</p>
          </div>
        )}

        {/* Order items */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Items</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {order.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <Link href={`/product/${item.product.slug}`} style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    {item.product.name}
                  </Link>
                  {item.variantLabel && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: '0.35rem' }}>— {item.variantLabel}</span>
                  )}
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>× {item.quantity}</span>
                </div>
                <span style={{ fontWeight: 500 }}>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22c55e' }}>
                <span>Discount {order.couponCode && `(${order.couponCode})`}</span><span>-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Shipping</span><span>{order.shipping > 0 ? `$${order.shipping.toFixed(2)}` : <span style={{ color: 'var(--success, #22c55e)' }}>Free</span>}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1.05rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <span>Total</span><span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="glass" style={{ padding: '1.25rem', borderRadius: '1rem' }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Shipping Address</h4>
            <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{order.shippingAddress}</p>
          </div>
          <div className="glass" style={{ padding: '1.25rem', borderRadius: '1rem' }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Payment</h4>
            <p style={{ margin: 0 }}>{paymentLabels[order.paymentMethod] || order.paymentMethod}</p>
          </div>
          <div className="glass" style={{ padding: '1.25rem', borderRadius: '1rem' }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Placed On</h4>
            <p style={{ margin: 0 }}>{new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        {order.notes && (
          <div className="glass" style={{ padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Order Notes</h4>
            <p style={{ margin: 0 }}>{order.notes}</p>
          </div>
        )}

        <Link href="/account" className="btn btn-secondary">← Back to Account</Link>
      </div>
    </section>
  )
}
