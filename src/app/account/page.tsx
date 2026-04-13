'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ReferralSection from '@/components/ReferralSection'

interface User {
  id: string
  email: string
  name: string | null
  role: string
}

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: { name: string }
}

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  items: OrderItem[]
}

export default function AccountPage() {
  return (
    <Suspense fallback={<section className="account-page"><div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Loading...</div></section>}>
      <AccountPageContent />
    </Suspense>
  )
}

function AccountPageContent() {
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirectTo = searchParams.get('redirect')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
          if (redirectTo) {
            router.push(redirectTo)
            return
          }
          fetch('/api/orders').then(r => r.json()).then(setOrders)
        }
      })
      .finally(() => setLoading(false))
  }, [redirectTo, router])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register'
    const body = tab === 'login' ? { email, password } : { email, password, name }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      return
    }
    setUser(data.user)
    if (redirectTo) {
      router.push(redirectTo)
      return
    }
    fetch('/api/orders').then(r => r.json()).then(setOrders)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setOrders([])
  }

  if (loading) {
    return (
      <section className="account-section">
        <div className="container account-loading">
          <div className="loading-spinner" aria-label="Loading" />
        </div>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="account-section">
        <div className="container auth-container">
          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Sign in to manage your orders and account.</p>
          </div>
          <div className="auth-card">
            <div className="auth-tabs">
              <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError('') }}>Sign In</button>
              <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError('') }}>Register</button>
            </div>
            <form onSubmit={handleAuth} className="auth-form glass">
              {tab === 'register' && (
                <label className="form-label">
                  Name
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="form-input" placeholder="Your name" />
                </label>
              )}
              <label className="form-label">
                Email
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="form-input" placeholder="you@example.com" />
              </label>
              <label className="form-label">
                Password
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="form-input" placeholder="••••••••" />
              </label>
              {error && <p className="auth-error" role="alert" aria-live="assertive">{error}</p>}
              <button type="submit" className="btn btn-primary auth-submit">
                {tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="account-section">
      <div className="container account-dashboard">
        <div className="account-header">
          <div>
            <h1>Welcome, {user.name || user.email.split('@')[0]}</h1>
            <p className="account-email">{user.email}</p>
            {user.role === 'admin' && (
              <Link href="/admin" className="admin-link">Admin Dashboard →</Link>
            )}
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">Sign Out</button>
        </div>

        <div className="account-stats">
          <div className="account-stat-card">
            <span className="account-stat-value">{orders.length}</span>
            <span className="account-stat-label">Orders</span>
          </div>
          <div className="account-stat-card">
            <span className="account-stat-value">${orders.reduce((s, o) => s + o.total, 0).toFixed(0)}</span>
            <span className="account-stat-label">Total Spent</span>
          </div>
          <div className="account-stat-card">
            <span className="account-stat-value">{orders.filter(o => o.status === 'delivered').length}</span>
            <span className="account-stat-label">Delivered</span>
          </div>
        </div>

        <h2 className="orders-heading">Order History</h2>

        <ReferralSection />

        {orders.length === 0 ? (
          <div className="orders-empty">
            <p>No orders yet.</p>
            <Link href="/#store" className="btn btn-secondary">Browse Products</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <Link key={order.id} href={`/account/orders/${order.id}`} className="order-card glass" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                <div className="order-header">
                  <span className="order-id">#{order.id.slice(-8)}</span>
                  <span className={`order-status status-${order.status}`}>{order.status}</span>
                </div>
                <div className="order-items">
                  {order.items.map(item => (
                    <span key={item.id}>{item.product.name} × {item.quantity}</span>
                  ))}
                </div>
                <div className="order-footer">
                  <span className="order-date">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="order-total">${order.total.toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
