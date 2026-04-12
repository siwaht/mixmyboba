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
import McpTab from './McpTab'

// ─── Types ───
interface Product {
  id: string; slug: string; name: string; price: number; description: string
  imageUrl: string; category: string; purity: string; stock: number; active: boolean
  tag?: string | null
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
}

type Tab = 'dashboard' | 'products' | 'orders' | 'customers' | 'inventory' | 'payments' | 'coupons' | 'content' | 'mcp'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'orders', label: 'Orders', icon: '📦' },
  { key: 'products', label: 'Products', icon: '🧪' },
  { key: 'customers', label: 'Customers', icon: '👥' },
  { key: 'inventory', label: 'Inventory', icon: '📋' },
  { key: 'payments', label: 'Payments', icon: '💳' },
  { key: 'coupons', label: 'Coupons', icon: '🏷️' },
  { key: 'content', label: 'Site Content', icon: '✏️' },
  { key: 'mcp', label: 'MCP', icon: '🤖' },
]

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Dashboard
  const [stats, setStats] = useState<Stats | null>(null)

  // Products
  const [products, setProducts] = useState<Product[]>([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    slug: '', name: '', price: '', description: '', imageUrl: '', category: '', purity: '', stock: '100', tag: '',
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
      default:
        done()
    }
  }, [tab, orderFilter, orderSearch, customerSearch])

  useEffect(() => { loadTabData() }, [loadTabData])

  // ─── Product CRUD ───
  const resetProductForm = () => {
    setProductForm({ slug: '', name: '', price: '', description: '', imageUrl: '', category: '', purity: '', stock: '100', tag: '' })
    setEditingProduct(null)
    setShowProductForm(false)
    setProductFormError('')
  }

  const startEditProduct = (p: Product) => {
    setEditingProduct(p)
    setProductForm({
      slug: p.slug, name: p.name, price: String(p.price), description: p.description,
      imageUrl: p.imageUrl, category: p.category, purity: p.purity, stock: String(p.stock),
      tag: p.tag || '',
    })
    setShowProductForm(true)
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProductFormError('')
    const body = { ...productForm, price: parseFloat(productForm.price), stock: parseInt(productForm.stock), tag: productForm.tag || null }

    if (editingProduct) {
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (!res.ok) { setProductFormError('Failed to update'); return }
      const updated = await res.json()
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p))
    } else {
      const res = await fetch('/api/admin/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json(); setProductFormError(d.error || 'Failed'); return }
      const product = await res.json()
      setProducts(prev => [product, ...prev])
    }
    resetProductForm()
  }

  const toggleProductActive = async (id: string, active: boolean) => {
    await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !active }),
    })
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !active } : p))
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product permanently?')) return
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  // ─── Order actions ───
  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrder(orderId)
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
      const s = await fetch('/api/admin/stats').then(r => r.json())
      setStats(s)
    }
    setUpdatingOrder(null)
  }

  // ─── Customer actions ───
  const updateCustomerRole = async (id: string, role: string) => {
    await fetch(`/api/admin/customers/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }),
    })
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, role } : c))
  }

  // ─── Inventory actions ───
  const updateStock = async (id: string, stock: number) => {
    await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock }),
    })
    setInventory(prev => prev.map(i => i.id === id ? { ...i, stock } : i))
    setEditingStock(null)
  }

  // ─── Settings actions ───
  const saveSettings = async () => {
    if (!settings) return
    await fetch('/api/admin/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
    })
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
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
              onClick={() => setTab(t.key)}
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
              onClick={() => setTab(t.key)}
            >
              <span>{t.icon}</span>
              <span className="admin-mobile-tab-label">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="admin-content">
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
            />
          )}

          {/* ═══ PAYMENTS ═══ */}
          {tab === 'payments' && <PaymentsTab stats={stats} orders={orders} loadOrders={() => {
            fetch('/api/admin/orders').then(r => r.json()).then(setOrders)
          }} />}

          {/* ═══ COUPONS ═══ */}
          {tab === 'coupons' && <CouponsTab />}

          {/* ═══ CONTENT ═══ */}
          {tab === 'content' && settings && (
            <ContentTab settings={settings} setSettings={setSettings} onSave={saveSettings} saved={settingsSaved} />
          )}

          {/* ═══ MCP ═══ */}
          {tab === 'mcp' && <McpTab />}
          </>}
        </div>
      </main>
    </div>
  )
}
