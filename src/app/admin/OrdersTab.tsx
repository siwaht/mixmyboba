'use client'

import { useState, useEffect } from 'react'

interface OrderItem { product: { name: string }; quantity: number; price: number }
interface Order {
  id: string; email: string; status: string; total: number; paymentMethod: string
  shippingAddress: string; notes: string | null; createdAt: string; items: OrderItem[]
  user?: { name: string | null; email: string }
}

interface ProductOption { id: string; name: string; price: number }

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

interface Props {
  orders: Order[]
  filter: string
  setFilter: (v: string) => void
  search: string
  setSearch: (v: string) => void
  updatingOrder: string | null
  selectedOrder: Order | null
  setSelectedOrder: (o: Order | null) => void
  onUpdateStatus: (id: string, status: string) => void
}

export default function OrdersTab({ orders, filter, setFilter, search, setSearch, updatingOrder, selectedOrder, setSelectedOrder, onUpdateStatus }: Props) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [products, setProducts] = useState<ProductOption[]>([])
  const [createForm, setCreateForm] = useState({
    email: '', shippingAddress: '', paymentMethod: 'card', status: 'pending', notes: '', discount: '0',
  })
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number }[]>([{ productId: '', quantity: 1 }])
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (showCreateForm && products.length === 0) {
      fetch('/api/admin/products').then(r => r.json()).then((p: ProductOption[]) => setProducts(p))
    }
  }, [showCreateForm, products.length])

  const addItem = () => setOrderItems([...orderItems, { productId: '', quantity: 1 }])
  const removeItem = (i: number) => setOrderItems(orderItems.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, value: string | number) => {
    setOrderItems(orderItems.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    const validItems = orderItems.filter(i => i.productId)
    if (validItems.length === 0) { setCreateError('Add at least one item'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...createForm, items: validItems }),
      })
      if (!res.ok) { const d = await res.json(); setCreateError(d.error || 'Failed'); setCreating(false); return }
      setShowCreateForm(false)
      setCreateForm({ email: '', shippingAddress: '', paymentMethod: 'card', status: 'pending', notes: '', discount: '0' })
      setOrderItems([{ productId: '', quantity: 1 }])
      window.location.reload()
    } catch {
      setCreateError('Failed to create order')
    }
    setCreating(false)
  }

  const getOrderTotal = () => {
    let subtotal = 0
    for (const item of orderItems) {
      const product = products.find(p => p.id === item.productId)
      if (product) subtotal += product.price * item.quantity
    }
    return Math.max(0, subtotal - (parseFloat(createForm.discount) || 0))
  }

  if (selectedOrder) {
    return (
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 className="admin-card-title" style={{ margin: 0 }}>Order #{selectedOrder.id.slice(-8)}</h3>
          <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>← Back</button>
        </div>
        <div className="admin-grid-2">
          <div>
            <div className="admin-detail-group">
              <span className="admin-detail-label">Email</span>
              <span>{selectedOrder.email}</span>
            </div>
            <div className="admin-detail-group">
              <span className="admin-detail-label">Status</span>
              <select value={selectedOrder.status} onChange={e => onUpdateStatus(selectedOrder.id, e.target.value)} className="form-input" style={{ width: 'auto', display: 'inline-block', padding: '0.4rem 0.6rem' }}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="admin-detail-group">
              <span className="admin-detail-label">Payment</span>
              <span className="admin-badge">{selectedOrder.paymentMethod}</span>
            </div>
            <div className="admin-detail-group">
              <span className="admin-detail-label">Date</span>
              <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <div>
            <div className="admin-detail-group">
              <span className="admin-detail-label">Shipping Address</span>
              <span style={{ whiteSpace: 'pre-wrap' }}>{selectedOrder.shippingAddress}</span>
            </div>
            {selectedOrder.notes && (
              <div className="admin-detail-group">
                <span className="admin-detail-label">Notes</span>
                <span>{selectedOrder.notes}</span>
              </div>
            )}
          </div>
        </div>
        <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Items</h4>
        <div className="admin-orders-table">
          <table>
            <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
            <tbody>
              {selectedOrder.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.product.name}</td><td>{item.quantity}</td>
                  <td>${item.price.toFixed(2)}</td><td>${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 600 }}>
                <td colSpan={3} style={{ textAlign: 'right' }}>Total</td>
                <td style={{ color: 'var(--accent-primary)' }}>${selectedOrder.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="admin-toolbar">
        <div className="admin-toolbar-filters">
          <select className="form-input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto', padding: '0.5rem 0.75rem' }}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <input className="form-input" placeholder="Search by email or order ID..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 260, padding: '0.5rem 0.75rem' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="admin-toolbar-count">{orders.length} orders</span>
          <a href="/api/admin/export/orders" className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem', textDecoration: 'none' }}>
            📥 Export CSV
          </a>
          <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Cancel' : '+ Create Order'}
          </button>
        </div>
      </div>

      {/* Manual Order Creation Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateOrder} className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="admin-card-title">Create Manual Order</h3>
          <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label className="form-label">
              Customer Email *
              <input required className="form-input" type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} placeholder="customer@example.com" />
            </label>
            <label className="form-label">
              Payment Method
              <select className="form-input" value={createForm.paymentMethod} onChange={e => setCreateForm({ ...createForm, paymentMethod: e.target.value })}>
                <option value="card">Card</option>
                <option value="crypto">Crypto</option>
                <option value="ach">ACH</option>
                <option value="paypal">PayPal</option>
                <option value="manual">Manual / Offline</option>
              </select>
            </label>
          </div>
          <label className="form-label" style={{ marginTop: '0.5rem' }}>
            Shipping Address *
            <textarea required className="form-input" rows={2} value={createForm.shippingAddress} onChange={e => setCreateForm({ ...createForm, shippingAddress: e.target.value })} placeholder="123 Main St, City, State, ZIP" />
          </label>

          {/* Order Items */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Items</span>
              <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }} onClick={addItem}>+ Add Item</button>
            </div>
            {orderItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <select className="form-input" value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} style={{ flex: 2 }}>
                  <option value="">Select product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} — ${p.price.toFixed(2)}</option>)}
                </select>
                <input type="number" min="1" className="form-input" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} style={{ width: 70 }} />
                {orderItems.length > 1 && (
                  <button type="button" className="admin-action-btn admin-action-danger" onClick={() => removeItem(i)}>✕</button>
                )}
              </div>
            ))}
          </div>

          <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: '0.75rem' }}>
            <label className="form-label">
              Status
              <select className="form-input" value={createForm.status} onChange={e => setCreateForm({ ...createForm, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="form-label">
              Discount ($)
              <input type="number" step="0.01" className="form-input" value={createForm.discount} onChange={e => setCreateForm({ ...createForm, discount: e.target.value })} />
            </label>
            <div className="form-label">
              Estimated Total
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '0.25rem' }}>
                ${getOrderTotal().toFixed(2)}
              </div>
            </div>
          </div>

          <label className="form-label" style={{ marginTop: '0.5rem' }}>
            Notes
            <textarea className="form-input" rows={2} value={createForm.notes} onChange={e => setCreateForm({ ...createForm, notes: e.target.value })} placeholder="Internal notes..." />
          </label>

          {createError && <p style={{ color: 'var(--error)', marginTop: '0.5rem', fontSize: '0.85rem' }}>{createError}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Order'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {orders.length === 0 ? (
        <div className="admin-card"><p className="admin-empty">No orders found</p></div>
      ) : (
        <div className="admin-orders-table">
          <table>
            <thead>
              <tr>
                <th>Order</th><th>Customer</th><th>Items</th><th>Total</th>
                <th>Payment</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td><code>#{order.id.slice(-6)}</code></td>
                  <td>{order.email}</td>
                  <td>{order.items.map(i => `${i.product.name}×${i.quantity}`).join(', ')}</td>
                  <td>${order.total.toFixed(2)}</td>
                  <td><span className="admin-badge">{order.paymentMethod}</span></td>
                  <td><span className={`order-status status-${order.status}`}>{order.status}</span></td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-action-btn" onClick={() => setSelectedOrder(order)} title="View Details">👁️</button>
                      <select value={order.status} onChange={e => onUpdateStatus(order.id, e.target.value)} disabled={updatingOrder === order.id} className="form-input" style={{ padding: '0.3rem', fontSize: '0.78rem', width: 95 }}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
