'use client'

import { useMemo, useState } from 'react'

interface InventoryItem {
  id: string; name: string; slug: string; stock: number; active: boolean
  category: string; price: number; totalSold: number
}

interface Props {
  inventory: InventoryItem[]
  editingStock: { id: string; stock: string } | null
  setEditingStock: (v: { id: string; stock: string } | null) => void
  onUpdateStock: (id: string, stock: number) => void
  onBulkUpdated: (updates: { id: string; stock: number }[]) => void
  onError: (message: string) => void
}

type BulkMode = 'set' | 'add'

export default function InventoryTab({
  inventory,
  editingStock,
  setEditingStock,
  onUpdateStock,
  onBulkUpdated,
  onError,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState<BulkMode>('add')
  const [bulkAmount, setBulkAmount] = useState('')
  const [applying, setApplying] = useState(false)
  const [bulkResult, setBulkResult] = useState('')

  const lowStock = inventory.filter(i => i.stock < 20 && i.active)
  const outOfStock = inventory.filter(i => i.stock === 0 && i.active)
  const totalValue = inventory.reduce((sum, i) => sum + i.stock * i.price, 0)

  const itemsById = useMemo(() => new Map(inventory.map(i => [i.id, i])), [inventory])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(prev => (prev.size === inventory.length ? new Set() : new Set(inventory.map(i => i.id))))
  }

  const commitSingle = (id: string, raw: string) => {
    const stock = parseInt(raw, 10)
    if (!Number.isInteger(stock) || stock < 0) {
      onError('Stock must be a whole number of 0 or more.')
      return
    }
    onUpdateStock(id, stock)
  }

  const applyBulk = async () => {
    const amount = parseInt(bulkAmount, 10)
    if (!Number.isInteger(amount)) {
      onError('Enter a whole number to apply.')
      return
    }
    if (bulkMode === 'set' && amount < 0) {
      onError('Stock cannot be set below 0.')
      return
    }

    const updates = [...selected].map(id => {
      const current = itemsById.get(id)?.stock ?? 0
      const stock = bulkMode === 'set' ? amount : Math.max(0, current + amount)
      return { id, stock }
    })
    if (updates.length === 0) return

    setApplying(true)
    setBulkResult('')
    try {
      const res = await fetch('/api/admin/inventory/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        onError((data as { error?: string }).error || 'Bulk stock update failed.')
        return
      }
      onBulkUpdated(updates)
      setBulkResult(`Updated ${data.updated ?? updates.length} product${updates.length === 1 ? '' : 's'}`)
      setSelected(new Set())
      setBulkAmount('')
    } catch {
      onError('Bulk stock update failed.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <>
      <div className="admin-stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card glass">
          <span className="stat-label">Total SKUs</span>
          <span className="stat-value">{inventory.length}</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-label">Inventory Value</span>
          <span className="stat-value">${totalValue.toFixed(0)}</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-label">Low Stock</span>
          <span className="stat-value" style={{ color: lowStock.length > 0 ? '#eab308' : 'var(--success)' }}>
            {lowStock.length}
          </span>
        </div>
        <div className="stat-card glass">
          <span className="stat-label">Out of Stock</span>
          <span className="stat-value" style={{ color: outOfStock.length > 0 ? 'var(--error)' : 'var(--success)' }}>
            {outOfStock.length}
          </span>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="admin-alert admin-alert-warning" style={{ marginBottom: '1.5rem' }}>
          ⚠️ Low stock alert: {lowStock.map(i => `${i.name} (${i.stock})`).join(', ')}
        </div>
      )}

      {/* Bulk restock bar — appears once rows are selected */}
      {selected.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
          padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 8,
          background: 'var(--bg-tertiary)', border: '1px solid var(--accent-primary)', fontSize: '0.85rem',
        }}>
          <span style={{ fontWeight: 600 }}>{selected.size} selected</span>
          <select
            className="form-input"
            style={{ width: 'auto', fontSize: '0.82rem', padding: '0.3rem 0.5rem' }}
            value={bulkMode}
            onChange={e => setBulkMode(e.target.value as BulkMode)}
            aria-label="Bulk stock mode"
          >
            <option value="add">Add to stock</option>
            <option value="set">Set stock to</option>
          </select>
          <input
            type="number"
            className="form-input"
            style={{ width: 100, fontSize: '0.82rem', padding: '0.3rem 0.5rem' }}
            value={bulkAmount}
            onChange={e => setBulkAmount(e.target.value)}
            placeholder={bulkMode === 'add' ? '+50' : '100'}
            aria-label="Bulk stock amount"
          />
          <button
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            onClick={applyBulk}
            disabled={applying || !bulkAmount.trim()}
          >
            {applying ? 'Applying...' : 'Apply'}
          </button>
          <button
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            onClick={() => setSelected(new Set())}
          >
            ✕ Clear
          </button>
        </div>
      )}

      {bulkResult && (
        <p style={{ color: 'var(--success)', fontSize: '0.82rem', marginBottom: '1rem' }}>✓ {bulkResult}</p>
      )}

      <div className="admin-orders-table">
        <table>
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  checked={selected.size === inventory.length && inventory.length > 0}
                  onChange={toggleAll}
                  aria-label="Select all products"
                />
              </th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Total Sold</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => (
              <tr key={item.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggle(item.id)}
                    aria-label={`Select ${item.name}`}
                  />
                </td>
                <td>{item.name}</td>
                <td><span className="admin-badge">{item.category}</span></td>
                <td>${item.price.toFixed(2)}</td>
                <td>
                  {editingStock?.id === item.id ? (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={editingStock.stock}
                        onChange={e => setEditingStock({ ...editingStock, stock: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitSingle(item.id, editingStock.stock)
                          if (e.key === 'Escape') setEditingStock(null)
                        }}
                        style={{ width: 80, padding: '0.3rem 0.5rem' }}
                        autoFocus
                        aria-label={`Stock for ${item.name}`}
                      />
                      <button
                        className="admin-action-btn"
                        onClick={() => commitSingle(item.id, editingStock.stock)}
                        title="Save"
                      >
                        ✓
                      </button>
                      <button className="admin-action-btn" onClick={() => setEditingStock(null)} title="Cancel">✕</button>
                    </div>
                  ) : (
                    <span className="admin-stock-indicator" data-level={item.stock === 0 ? 'out' : item.stock < 20 ? 'low' : item.stock < 50 ? 'medium' : 'good'}>
                      <span className="admin-stock-bar" style={{ width: `${Math.min(100, (item.stock / 200) * 100)}%` }} />
                      <span className="admin-stock-num">{item.stock}</span>
                    </span>
                  )}
                </td>
                <td>{item.totalSold}</td>
                <td>
                  <span className={`order-status ${item.active ? 'status-delivered' : 'status-cancelled'}`}>
                    {item.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button className="admin-action-btn" onClick={() => setEditingStock({ id: item.id, stock: String(item.stock) })} title="Edit Stock">
                    ✏️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
