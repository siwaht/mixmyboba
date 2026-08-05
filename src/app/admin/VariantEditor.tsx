'use client'

import { useCallback, useEffect, useState } from 'react'

interface Variant {
  id: string
  productId: string
  label: string
  price: number
  stock: number
  active: boolean
}

interface Props {
  productId: string
  productName: string
  onClose: () => void
}

const blankDraft = { label: '', price: '', stock: '100' }

/**
 * Manages the sizes a product is sold in.
 *
 * Variant price and stock are what the order endpoint charges and decrements
 * once a size is chosen, so without this editor the admin had no way to correct
 * either number.
 */
export default function VariantEditor({ productId, productName, onClose }: Props) {
  const [variants, setVariants] = useState<Variant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [draft, setDraft] = useState(blankDraft)
  const [creating, setCreating] = useState(false)
  // Bumped to re-run the fetch after a create or delete changes the list length.
  const [reloadToken, setReloadToken] = useState(0)
  const reload = useCallback(() => setReloadToken(t => t + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    fetch(`/api/admin/products/${productId}/variants`, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error('Failed to load sizes')
        return r.json()
      })
      .then((data: Variant[]) => {
        setVariants(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return
        setError(e instanceof Error ? e.message : 'Failed to load sizes')
        setLoading(false)
      })

    return () => controller.abort()
  }, [productId, reloadToken])

  const createVariant = async () => {
    setError('')
    const price = parseFloat(draft.price)
    const stock = parseInt(draft.stock, 10)
    if (!draft.label.trim()) {
      setError('Size label is required')
      return
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('Price must be greater than 0')
      return
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setError('Stock must be 0 or more')
      return
    }

    setCreating(true)
    const res = await fetch(`/api/admin/products/${productId}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: draft.label.trim(), price, stock }),
    })
    setCreating(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Failed to add size')
      return
    }
    setDraft(blankDraft)
    reload()
  }

  const patchVariant = async (variantId: string, data: Record<string, unknown>) => {
    setError('')
    setBusyId(variantId)
    const res = await fetch(`/api/admin/products/${productId}/variants`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId, ...data }),
    })
    setBusyId(null)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Failed to update size')
      return
    }
    const updated: Variant = await res.json()
    setVariants(prev => prev.map(v => (v.id === updated.id ? updated : v)))
  }

  const deleteVariant = async (variant: Variant) => {
    if (!confirm(`Delete the "${variant.label}" size? Past orders keep their recorded size.`)) return
    setError('')
    setBusyId(variant.id)
    const res = await fetch(`/api/admin/products/${productId}/variants`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId: variant.id }),
    })
    setBusyId(null)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Failed to delete size')
      return
    }
    setVariants(prev => prev.filter(v => v.id !== variant.id))
  }

  return (
    <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <h3 className="admin-card-title" style={{ margin: 0 }}>📐 Sizes — {productName}</h3>
        <button
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
          onClick={onClose}
        >
          ✕ Close
        </button>
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.5rem 0 1rem' }}>
        The cheapest active size sets the &ldquo;from&rdquo; price on the storefront. Each size keeps its own
        stock count, which is what gets reduced when a customer buys that size.
      </p>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading sizes...</p>
      ) : (
        <div className="admin-orders-table">
          <table>
            <thead>
              <tr>
                <th>Size</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No sizes yet — the base product price is used on its own.
                  </td>
                </tr>
              )}
              {variants.map(v => (
                <tr key={v.id} style={{ opacity: busyId === v.id ? 0.5 : 1 }}>
                  <td>
                    <input
                      className="form-input"
                      style={{ minWidth: 140 }}
                      defaultValue={v.label}
                      aria-label={`Label for ${v.label}`}
                      onBlur={e => {
                        const label = e.target.value.trim()
                        if (label && label !== v.label) patchVariant(v.id, { label })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      style={{ width: 100 }}
                      defaultValue={v.price}
                      aria-label={`Price for ${v.label}`}
                      onBlur={e => {
                        const price = parseFloat(e.target.value)
                        if (Number.isFinite(price) && price > 0 && price !== v.price) {
                          patchVariant(v.id, { price })
                        }
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      style={{ width: 90 }}
                      defaultValue={v.stock}
                      aria-label={`Stock for ${v.label}`}
                      onBlur={e => {
                        const stock = parseInt(e.target.value, 10)
                        if (Number.isInteger(stock) && stock >= 0 && stock !== v.stock) {
                          patchVariant(v.id, { stock })
                        }
                      }}
                    />
                  </td>
                  <td>
                    <span className={`order-status ${v.active ? 'status-delivered' : 'status-cancelled'}`}>
                      {v.active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="admin-action-btn"
                        title={v.active ? 'Hide from storefront' : 'Show on storefront'}
                        onClick={() => patchVariant(v.id, { active: !v.active })}
                      >
                        {v.active ? '🔒' : '🔓'}
                      </button>
                      <button
                        className="admin-action-btn admin-action-danger"
                        title="Delete size"
                        onClick={() => deleteVariant(v)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap', marginTop: '1rem' }}>
        <label className="form-label" style={{ flex: '1 1 160px', minWidth: 160 }}>
          New size
          <input
            className="form-input"
            value={draft.label}
            onChange={e => setDraft({ ...draft, label: e.target.value })}
            placeholder="Large (500g)"
          />
        </label>
        <label className="form-label" style={{ flex: '0 0 120px' }}>
          Price ($)
          <input
            type="number"
            step="0.01"
            className="form-input"
            value={draft.price}
            onChange={e => setDraft({ ...draft, price: e.target.value })}
            placeholder="42.99"
          />
        </label>
        <label className="form-label" style={{ flex: '0 0 110px' }}>
          Stock
          <input
            type="number"
            className="form-input"
            value={draft.stock}
            onChange={e => setDraft({ ...draft, stock: e.target.value })}
          />
        </label>
        <button
          className="btn btn-primary"
          style={{ height: 38, whiteSpace: 'nowrap' }}
          onClick={createVariant}
          disabled={creating}
        >
          {creating ? 'Adding...' : '+ Add Size'}
        </button>
      </div>

      {error && <p style={{ color: 'var(--error)', marginTop: '0.5rem', fontSize: '0.82rem' }}>{error}</p>}
    </div>
  )
}
