'use client'

import { useState, useEffect } from 'react'

interface Coupon {
  id: string
  code: string
  type: string
  value: number
  minOrder: number
  maxUses: number | null
  usedCount: number
  active: boolean
  expiresAt: string | null
  createdAt: string
}

export default function CouponsTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', type: 'percent', value: '', minOrder: '0', maxUses: '', expiresAt: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/coupons').then(r => r.json()).then(setCoupons)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) { setError('Failed to create coupon'); return }
    const coupon = await res.json()
    setCoupons(prev => [coupon, ...prev])
    setShowForm(false)
    setForm({ code: '', type: 'percent', value: '', minOrder: '0', maxUses: '', expiresAt: '' })
  }

  const toggleActive = async (coupon: Coupon) => {
    const res = await fetch('/api/admin/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: coupon.id, active: !coupon.active }),
    })
    if (res.ok) {
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, active: !c.active } : c))
    }
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return
    await fetch('/api/admin/coupons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setCoupons(prev => prev.filter(c => c.id !== id))
  }

  return (
    <>
      <div className="admin-toolbar">
        <span className="admin-toolbar-count">{coupons.length} coupon{coupons.length !== 1 ? 's' : ''}</span>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Coupon'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <label className="form-label">
              Code
              <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="form-input" placeholder="SAVE20" style={{ textTransform: 'uppercase' }} />
            </label>
            <label className="form-label">
              Type
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="form-input">
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </label>
            <label className="form-label">
              Value {form.type === 'percent' ? '(%)' : '($)'}
              <input required type="number" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="form-input" />
            </label>
            <label className="form-label">
              Min Order ($)
              <input type="number" step="0.01" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })} className="form-input" />
            </label>
            <label className="form-label">
              Max Uses (blank = unlimited)
              <input type="number" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} className="form-input" />
            </label>
            <label className="form-label">
              Expires (optional)
              <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className="form-input" />
            </label>
          </div>
          {error && <p className="auth-error" style={{ marginTop: '0.75rem' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Create Coupon</button>
        </form>
      )}

      <div className="admin-orders-table">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Min Order</th>
              <th>Usage</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.id}>
                <td><code>{c.code}</code></td>
                <td>{c.type === 'percent' ? `${c.value}%` : `$${c.value.toFixed(2)}`}</td>
                <td>${c.minOrder.toFixed(2)}</td>
                <td>{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}</td>
                <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '\u2014'}</td>
                <td>
                  <span className={`order-status ${c.active ? 'status-delivered' : 'status-cancelled'}`}>
                    {c.active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td>
                  <div className="admin-actions">
                    <button className="admin-action-btn" onClick={() => toggleActive(c)}>
                      {c.active ? 'Disable' : 'Enable'}
                    </button>
                    <button className="admin-action-btn admin-action-danger" onClick={() => deleteCoupon(c.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={7} className="admin-empty">No coupons yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
