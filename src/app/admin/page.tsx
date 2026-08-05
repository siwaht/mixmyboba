'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import DashboardTab from './DashboardTab'
import ProductsTab from './ProductsTab'
import OrdersTab from './OrdersTab'
import CustomersTab from './CustomersTab'
import InventoryTab from './InventoryTab'
import PaymentsTab from './PaymentsTab'
import ContentTab from './ContentTab'
import CouponsTab from './CouponsTab'
import PagesTab from './PagesTab'
import McpTab from './McpTab'
import WebhooksTab from './WebhooksTab'
import ReviewsTab from './ReviewsTab'

// ─── Types ───
interface Product {
  id: string; slug: string; name: string; price: number; description: string
  imageUrl: string; category: string; servings: string; stock: number; active: boolean
  tag?: string | null
  variants?: { id: string; label: string; price: number; stock: number; active: boolean }[]
}

interface OrderItem { product: { name: string }; quantity: number; price: number }
interface Order {
  id: string; email: string; status: string; total: number; paymentMethod: string
  shippingAddress: string; notes: string | null; createdAt: string; items: OrderItem[]
  user?: { name: string | null; email: string }
}

interface Customer {
  id: string; email: string; name: string | null; role: string; createdAt: string
  orders: { id: string; total: number; status: string }[]
}

interface InventoryItem {
  id: string; name: string; slug: string; stock: number; active: boolean
  category: string; price: number; totalSold: number
}

interface Stats {
  totalProducts: number; totalOrders: number; totalUsers: number
  totalRevenue: number; paidRevenue: number; lowStockProducts: number
  pendingOrders: number; paidOrders: number; shippedOrders: number
  deliveredOrders: number; cancelledOrders: number
  recentOrders: Order[]; topProducts: { name: string; revenue: number; sold: number }[]
}

interface SiteSettings {
  hero: {
    title: string; titleHighlight: string; subtitle: string
    ctaPrimary: { text: string; href: string }
    ctaSecondary: { text: string; href: string }
  }
  trustBadges: { icon: string; label: string }[]
  marqueeItems: string[]
  statsBar: { value: string; label: string }[]
  announcement: string
  announcementLink?: string
  announcementLinkText?: string
}

type Tab = 'dashboard' | 'products' | 'orders' | 'customers' | 'inventory' | 'reviews' | 'payments' | 'coupons' | 'content' | 'pages' | 'webhooks' | 'mcp'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'orders', label: 'Orders', icon: '📦' },
  { key: 'products', label: 'Products', icon: '🧋' },
  { key: 'customers', label: 'Customers', icon: '👥' },
  { key: 'inventory', label: 'Inventory', icon: '📋' },
  { key: 'reviews', label: 'Reviews', icon: '⭐' },
  { key: 'payments', label: 'Payments', icon: '💳' },
  { key: 'coupons', label: 'Coupons', icon: '🏷️' },
  { key: 'content', label: 'Site Content', icon: '✏️' },
  { key: 'pages', label: 'Pages', icon: '📄' },
  { key: 'webhooks', label: 'Webhooks', icon: '🔔' },
  { key: 'mcp', label: 'MCP', icon: '🤖' },
]

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginSubmitting, setLoginSubmitting] = useState(false)

  // Read tab from URL hash on mount (supports /admin#orders, etc.)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as Tab
    if (hash && TABS.some(t => t.key === hash)) {
      setTab(hash)
    }
  }, [])

  // Check if user is authenticated as admin
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user?.role === 'admin') {
          setAuthed(true)
        }
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false))
  }, [])

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLoginError(data.error || 'Invalid credentials')
        return
      }
      if (data.user?.role !== 'admin') {
        setLoginError('This account does not have admin access.')
        return
      }
      setAuthed(true)
    } catch {
      setLoginError('Login failed. Please try again.')
    } finally {
      setLoginSubmitting(false)
    }
  }

  // Dashboard
  const [stats, setStats] = useState<Stats | null>(null)

  // Products
  const [products, setProducts] = useState<Product[]>([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    slug: '', name: '', price: '', description: '', imageUrl: '', category: '', servings: '', stock: '100', tag: '',
  })
  const [productFormError, setProductFormError] = useState('')

  // Orders
  const [orders, setOrders] = useState<Order[]>([])
  const [orderFilter, setOrderFilter] = useState('')
  const [orderSearch, setOrderSearch] = useState('')
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Customers
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSearch, setCustomerSearch] = useState('')

  // Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [editingStock, setEditingStock] = useState<{ id: string; stock: string } | null>(null)

  // Content
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [settingsSaved, setSettingsSaved] = useState(false)

  // Pages
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pageContent, setPageContent] = useState<any>(null)
  const [pagesSaved, setPagesSaved] = useState(false)

  // Tab loading
  const [tabLoading, setTabLoading] = useState(false)

  // ─── Load stats on mount ───
  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => { if (!r.ok) throw new Error('Unauthorized'); return r.json() })
      .then(setStats)
      .catch(() => setError('Admin access required. Please sign in as admin.'))
  }, [])

  // ─── Load tab data ───
  const loadTabData = useCallback(() => {
    setTabLoading(true)
    const done = () => setTabLoading(false)
    switch (tab) {
      case 'products':
        fetch('/api/admin/products').then(r => r.json()).then(d => { setProducts(d); done() }).catch(done)
        break
      case 'orders': {
        const oParams = new URLSearchParams()
        if (orderFilter) oParams.set('status', orderFilter)
        if (orderSearch) oParams.set('search', orderSearch)
        fetch(`/api/admin/orders?${oParams}`).then(r => r.json()).then(d => { setOrders(d); done() }).catch(done)
        break
      }
      case 'customers': {
        const cParams = new URLSearchParams()
        if (customerSearch) cParams.set('search', customerSearch)
        fetch(`/api/admin/customers?${cParams}`).then(r => r.json()).then(d => { setCustomers(d); done() }).catch(done)
        break
      }
      case 'inventory':
        fetch('/api/admin/inventory').then(r => r.json()).then(d => { setInventory(d); done() }).catch(done)
        break
      case 'content':
        fetch('/api/admin/settings').then(r => r.json()).then(d => { setSettings(d); done() }).catch(done)
        break
      case 'pages':
        fetch('/api/admin/page-content').then(r => r.json()).then(d => { setPageContent(d); done() }).catch(done)
        break
      default:
        done()
    }
  }, [tab, orderFilter, orderSearch, customerSearch])

  useEffect(() => { loadTabData() }, [loadTabData])

  // ─── Product CRUD ───
  const resetProductForm = () => {
    setProductForm({ slug: '', name: '', price: '', description: '', imageUrl: '', category: '', servings: '', stock: '100', tag: '' })
    setEditingProduct(null)
    setShowProductForm(false)
    setProductFormError('')
  }

  const startEditProduct = (p: Product) => {
    setEditingProduct(p)
    setProductForm({
      slug: p.slug, name: p.name, price: String(p.price), description: p.description,
      imageUrl: p.imageUrl, category: p.category, servings: p.servings, stock: String(p.stock),
      tag: p.tag || '',
    })
    setShowProductForm(true)
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProductFormError('')

    const price = parseFloat(productForm.price)
    const stock = parseInt(productForm.stock, 10)
    if (!Number.isFinite(price) || price <= 0) {
      setProductFormError('Price must be a number greater than 0.')
      return
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setProductFormError('Stock must be a whole number of 0 or more.')
      return
    }

    const body = { ...productForm, price, stock, tag: productForm.tag || null }
    const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products'
    const method = editingProduct ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setProductFormError(d.error || `Failed to ${editingProduct ? 'update' : 'create'} product.`)
      return
    }

    const saved = await res.json()
    setProducts(prev =>
      editingProduct ? prev.map(p => (p.id === saved.id ? saved : p)) : [saved, ...prev]
    )
    resetProductForm()
  }

  /** Reads `{ error }` out of a failed response, falling back to a default. */
  const errorFrom = async (res: Response, fallback: string) => {
    const data = await res.json().catch(() => ({}))
    return (data as { error?: string }).error || fallback
  }

  const toggleProductActive = async (id: string, active: boolean) => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !active }),
    })
    if (!res.ok) {
      setError(await errorFrom(res, 'Could not change the product status.'))
      return
    }
    const updated = await res.json()
    setProducts(prev => prev.map(p => (p.id === id ? updated : p)))
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product permanently? Products that have already been ordered can only be deactivated.')) return
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      setError(await errorFrom(res, 'Could not delete the product.'))
      return
    }
    setError('')
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  // ─── Order actions ───
  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrder(orderId)
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setError('')
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
      // Cancelling returns stock and frees a coupon use, so the dashboard
      // figures need refreshing rather than patching locally.
      const statsRes = await fetch('/api/admin/stats')
      if (statsRes.ok) setStats(await statsRes.json())
    } else {
      setError(await errorFrom(res, 'Could not update the order status.'))
    }
    setUpdatingOrder(null)
  }

  // ─── Customer actions ───
  const updateCustomerRole = async (id: string, role: string) => {
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }),
    })
    if (!res.ok) {
      setError(await errorFrom(res, 'Could not change the customer role.'))
      return
    }
    setError('')
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, role } : c))
  }

  // ─── Inventory actions ───
  const updateStock = async (id: string, stock: number) => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock }),
    })
    if (!res.ok) {
      setError(await errorFrom(res, 'Could not update stock.'))
      return
    }
    setError('')
    setInventory(prev => prev.map(i => i.id === id ? { ...i, stock } : i))
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, stock } : p)))
    setEditingStock(null)
  }

  /** Reflects a completed bulk stock change in both inventory and product views. */
  const applyBulkStock = (updates: { id: string; stock: number }[]) => {
    const map = new Map(updates.map(u => [u.id, u.stock]))
    setError('')
    setInventory(prev => prev.map(i => (map.has(i.id) ? { ...i, stock: map.get(i.id)! } : i)))
    setProducts(prev => prev.map(p => (map.has(p.id) ? { ...p, stock: map.get(p.id)! } : p)))
  }

  // ─── Settings actions ───
  const saveSettings = async () => {
    if (!settings) return
    const res = await fetch('/api/admin/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
    })
    if (!res.ok) {
      setError(await errorFrom(res, 'Could not save site content.'))
      return
    }
    setError('')
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  const savePageContent = async () => {
    if (!pageContent) return
    const res = await fetch('/api/admin/page-content', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pageContent),
    })
    if (!res.ok) {
      setError(await errorFrom(res, 'Could not save page content.'))
      return
    }
    setError('')
    setPagesSaved(true)
    setTimeout(() => setPagesSaved(false), 2000)
  }

  // ─── Auth gate ───
  if (authLoading) {
    return (
      <section className="admin-section">
        <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Checking authentication...
        </div>
      </section>
    )
  }

  if (!authed) {
    return (
      <section className="admin-section">
        <div className="container" style={{ maxWidth: 400, padding: '6rem 2rem' }}>
          <div className="glass" style={{ padding: '2.5rem', borderRadius: '1rem', textAlign: 'center' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>🔒 Admin Login</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Sign in with your admin account to continue.</p>
            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="form-input"
                placeholder="Admin email"
                autoComplete="email"
              />
              <input
                type="password"
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="form-input"
                placeholder="Password"
                autoComplete="current-password"
              />
              {loginError && <p style={{ color: 'var(--error)', fontSize: '0.85rem', margin: 0 }}>{loginError}</p>}
              <button type="submit" className="btn btn-primary" disabled={loginSubmitting} style={{ width: '100%' }}>
                {loginSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <Link href="/" style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>← Back to site</Link>
          </div>
        </div>
      </section>
    )
  }

  // ─── Error state ───
  if (error) {
    return (
      <section className="admin-section">
        <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
          <h1 style={{ color: 'var(--error)' }}>{error}</h1>
          <Link href="/account" className="btn btn-primary" style={{ marginTop: '2rem' }}>Sign In</Link>
        </div>
      </section>
    )
  }

  if (!stats) {
    return (
      <section className="admin-section">
        <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading dashboard...
        </div>
      </section>
    )
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="admin-sidebar-header">
          <span className="admin-sidebar-logo">⚗️ Admin</span>
          <button className="admin-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <nav className="admin-sidebar-nav">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`admin-sidebar-item ${tab === t.key ? 'active' : ''}`}
              onClick={() => { setTab(t.key); window.history.replaceState(null, '', `/admin#${t.key}`) }}
              title={t.label}
            >
              <span className="admin-sidebar-icon">{t.icon}</span>
              {sidebarOpen && <span className="admin-sidebar-label">{t.label}</span>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-sidebar-item" title="Back to Site">
            <span className="admin-sidebar-icon">←</span>
            {sidebarOpen && <span className="admin-sidebar-label">Back to Site</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-topbar">
          <h1 className="admin-page-title">
            {TABS.find(t => t.key === tab)?.icon} {TABS.find(t => t.key === tab)?.label}
          </h1>
          <div className="admin-topbar-right">
            <span className="admin-topbar-badge">Admin</span>
          </div>
        </div>

        {/* Mobile tab nav */}
        <div className="admin-mobile-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`admin-mobile-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => { setTab(t.key); window.history.replaceState(null, '', `/admin#${t.key}`) }}
            >
              <span>{t.icon}</span>
              <span className="admin-mobile-tab-label">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="admin-content">
          {error && (
            <div
              role="alert"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 8,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                color: 'var(--error, #ef4444)', fontSize: '0.85rem',
              }}
            >
              <span aria-hidden="true">⚠️</span>
              <span style={{ flex: 1 }}>{error}</span>
              <button
                onClick={() => setError('')}
                aria-label="Dismiss error"
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                ✕
              </button>
            </div>
          )}

          {tabLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
              <div className="loading-spinner" aria-label="Loading tab data" />
            </div>
          )}

          {!tabLoading && <>
          {/* ═══ DASHBOARD ═══ */}
          {tab === 'dashboard' && <DashboardTab stats={stats} setTab={setTab} />}

          {/* ═══ PRODUCTS ═══ */}
          {tab === 'products' && (
            <ProductsTab
              products={products}
              showForm={showProductForm}
              setShowForm={setShowProductForm}
              form={productForm}
              setForm={setProductForm}
              formError={productFormError}
              editingProduct={editingProduct}
              onSubmit={handleProductSubmit}
              onReset={resetProductForm}
              onEdit={startEditProduct}
              onToggle={toggleProductActive}
              onDelete={deleteProduct}
            />
          )}

          {/* ═══ ORDERS ═══ */}
          {tab === 'orders' && (
            <OrdersTab
              orders={orders}
              filter={orderFilter}
              setFilter={setOrderFilter}
              search={orderSearch}
              setSearch={setOrderSearch}
              updatingOrder={updatingOrder}
              selectedOrder={selectedOrder}
              setSelectedOrder={setSelectedOrder}
              onUpdateStatus={updateOrderStatus}
            />
          )}

          {/* ═══ CUSTOMERS ═══ */}
          {tab === 'customers' && (
            <CustomersTab
              customers={customers}
              search={customerSearch}
              setSearch={setCustomerSearch}
              onUpdateRole={updateCustomerRole}
            />
          )}

          {/* ═══ INVENTORY ═══ */}
          {tab === 'inventory' && (
            <InventoryTab
              inventory={inventory}
              editingStock={editingStock}
              setEditingStock={setEditingStock}
              onUpdateStock={updateStock}
              onBulkUpdated={applyBulkStock}
              onError={setError}
            />
          )}

          {/* ═══ PAYMENTS ═══ */}
          {tab === 'payments' && <PaymentsTab stats={stats} orders={orders} loadOrders={() => {
            fetch('/api/admin/orders').then(r => r.json()).then(setOrders)
          }} />}

          {/* ═══ REVIEWS ═══ */}
          {tab === 'reviews' && <ReviewsTab />}

          {/* ═══ COUPONS ═══ */}
          {tab === 'coupons' && <CouponsTab />}

          {/* ═══ CONTENT ═══ */}
          {tab === 'content' && settings && (
            <ContentTab settings={settings} setSettings={setSettings} onSave={saveSettings} saved={settingsSaved} />
          )}

          {/* ═══ PAGES ═══ */}
          {tab === 'pages' && pageContent && (
            <PagesTab content={pageContent} setContent={setPageContent} onSave={savePageContent} saved={pagesSaved} />
          )}

          {/* ═══ WEBHOOKS ═══ */}
          {tab === 'webhooks' && <WebhooksTab />}

          {/* ═══ MCP ═══ */}
          {tab === 'mcp' && <McpTab />}
          </>}
        </div>
      </main>
    </div>
  )
}
