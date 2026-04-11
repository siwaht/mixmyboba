'use client'

import { useState, useRef, useEffect } from 'react'

interface ProductTag {
  slug: string
  label: string
  emoji: string
  color: string
}

interface Product {
  id: string; slug: string; name: string; price: number; description: string
  imageUrl: string; category: string; purity: string; stock: number; active: boolean
  tag?: string | null
}

interface Props {
  products: Product[]
  showForm: boolean
  setShowForm: (v: boolean) => void
  form: { slug: string; name: string; price: string; description: string; imageUrl: string; category: string; purity: string; stock: string; tag: string }
  setForm: (f: Props['form']) => void
  formError: string
  editingProduct: Product | null
  onSubmit: (e: React.FormEvent) => void
  onReset: () => void
  onEdit: (p: Product) => void
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}

export default function ProductsTab({ products, showForm, setShowForm, form, setForm, formError, editingProduct, onSubmit, onReset, onEdit, onToggle, onDelete }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const [importing, setImporting] = useState(false)

  // Dynamic tags
  const [tags, setTags] = useState<ProductTag[]>([])
  const [showTagManager, setShowTagManager] = useState(false)
  const [newTag, setNewTag] = useState({ slug: '', label: '', emoji: '🏷️', color: '#3b82f6' })
  const [tagError, setTagError] = useState('')

  // Bulk tag assignment
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())
  const [bulkTag, setBulkTag] = useState('')
  const [bulkApplying, setBulkApplying] = useState(false)

  // Auto-tagging
  const [autoTagRunning, setAutoTagRunning] = useState(false)
  const [autoTagResult, setAutoTagResult] = useState<string | null>(null)

  // Tag analytics
  const [tagAnalytics, setTagAnalytics] = useState<{ tag: string; productCount: number; totalSold: number; totalRevenue: number }[] | null>(null)

  useEffect(() => {
    fetch('/api/admin/tags').then(r => r.json()).then(setTags).catch(() => {})
  }, [])

  const tagMap = Object.fromEntries(tags.map(t => [t.slug, t]))

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/admin/import/products', { method: 'POST', body: formData })
      const data = await res.json()
      setImportResult(data)
      window.location.reload()
    } catch {
      setImportResult({ imported: 0, skipped: 0, errors: ['Upload failed'] })
    }
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const addTag = async () => {
    setTagError('')
    if (!newTag.slug || !newTag.label || !newTag.color) {
      setTagError('Slug, label, and color are required')
      return
    }
    const res = await fetch('/api/admin/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTag),
    })
    if (!res.ok) {
      const d = await res.json()
      setTagError(d.error || 'Failed to create tag')
      return
    }
    const created = await res.json()
    setTags(prev => [...prev, created])
    setNewTag({ slug: '', label: '', emoji: '🏷️', color: '#3b82f6' })
  }

  const deleteTag = async (slug: string) => {
    if (!confirm(`Delete tag "${slug}"? Products using it will keep the value but it won't display.`)) return
    await fetch(`/api/admin/tags?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' })
    setTags(prev => prev.filter(t => t.slug !== slug))
  }

  const toggleBulkSelect = (id: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectAllBulk = () => {
    if (bulkSelected.size === products.length) setBulkSelected(new Set())
    else setBulkSelected(new Set(products.map(p => p.id)))
  }

  const applyBulkTag = async () => {
    if (bulkSelected.size === 0) return
    setBulkApplying(true)
    await fetch('/api/admin/bulk-tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds: Array.from(bulkSelected), tag: bulkTag }),
    })
    setBulkApplying(false)
    setBulkSelected(new Set())
    window.location.reload()
  }

  const runAutoTags = async () => {
    setAutoTagRunning(true)
    setAutoTagResult(null)
    const res = await fetch('/api/admin/auto-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'run' }),
    })
    const data = await res.json()
    setAutoTagResult(`Tagged ${data.totalTagged} products`)
    setAutoTagRunning(false)
    if (data.totalTagged > 0) setTimeout(() => window.location.reload(), 1500)
  }

  const loadTagAnalytics = async () => {
    const res = await fetch('/api/admin/tag-analytics')
    const data = await res.json()
    setTagAnalytics(data.tagBreakdown)
  }

  return (
    <>
      <div className="admin-toolbar">
        <span className="admin-toolbar-count">{products.length} products</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }} onClick={() => setShowTagManager(!showTagManager)}>
            🏷️ {showTagManager ? 'Hide Tags' : 'Manage Tags'}
          </button>
          <a href="/api/admin/export/products" className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem', textDecoration: 'none' }}>
            📥 Export CSV
          </a>
          <button className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }} onClick={() => fileRef.current?.click()} disabled={importing}>
            {importing ? '⏳ Importing...' : '📤 Import CSV'}
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
          <button className="btn btn-primary" onClick={() => { if (showForm) onReset(); else setShowForm(true) }}>
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>
      </div>

      {/* Tag Manager */}
      {showTagManager && (
        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="admin-card-title">🏷️ Product Tags</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Create custom tags to highlight products on the storefront. Each tag needs a unique slug, display label, emoji, and color.
          </p>

          {/* Existing tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {tags.map(t => (
              <div key={t.slug} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.4rem 0.75rem', borderRadius: 8,
                background: `${t.color}18`, border: `1px solid ${t.color}44`,
                fontSize: '0.82rem',
              }}>
                <span>{t.emoji}</span>
                <span style={{ color: t.color, fontWeight: 600 }}>{t.label}</span>
                <code style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.slug}</code>
                <button
                  onClick={() => deleteTag(t.slug)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '0.9rem', padding: '0 0.2rem' }}
                  title="Delete tag"
                  aria-label={`Delete tag ${t.label}`}
                >✕</button>
              </div>
            ))}
            {tags.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No tags yet</span>}
          </div>

          {/* Add new tag */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <label className="form-label" style={{ flex: '1 1 120px', minWidth: 120 }}>
              Slug
              <input className="form-input" value={newTag.slug} onChange={e => setNewTag({ ...newTag, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} placeholder="my_tag" />
            </label>
            <label className="form-label" style={{ flex: '1 1 140px', minWidth: 140 }}>
              Label
              <input className="form-input" value={newTag.label} onChange={e => setNewTag({ ...newTag, label: e.target.value })} placeholder="My Tag" />
            </label>
            <label className="form-label" style={{ flex: '0 0 70px' }}>
              Emoji
              <input className="form-input" value={newTag.emoji} onChange={e => setNewTag({ ...newTag, emoji: e.target.value })} placeholder="🏷️" />
            </label>
            <label className="form-label" style={{ flex: '0 0 70px' }}>
              Color
              <input type="color" className="form-input" value={newTag.color} onChange={e => setNewTag({ ...newTag, color: e.target.value })} style={{ padding: '0.2rem', height: 38 }} />
            </label>
            <button className="btn btn-primary" style={{ height: 38, whiteSpace: 'nowrap' }} onClick={addTag}>+ Add Tag</button>
          </div>
          {tagError && <p style={{ color: 'var(--error)', marginTop: '0.5rem', fontSize: '0.82rem' }}>{tagError}</p>}

          {/* Auto-tag & Analytics */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={runAutoTags} disabled={autoTagRunning}>
              {autoTagRunning ? '⏳ Running...' : '🤖 Run Auto-Tags'}
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={loadTagAnalytics}>
              📊 Tag Analytics
            </button>
            {autoTagResult && <span style={{ fontSize: '0.82rem', color: 'var(--success)' }}>✓ {autoTagResult}</span>}
          </div>

          {/* Tag Analytics */}
          {tagAnalytics && (
            <div style={{ marginTop: '1rem' }}>
              <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border-color)' }}>Tag</th>
                    <th style={{ textAlign: 'right', padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border-color)' }}>Products</th>
                    <th style={{ textAlign: 'right', padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border-color)' }}>Units Sold</th>
                    <th style={{ textAlign: 'right', padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border-color)' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {tagAnalytics.map(t => {
                    const info = tagMap[t.tag]
                    return (
                      <tr key={t.tag}>
                        <td style={{ padding: '0.4rem 0.5rem' }}>
                          <span style={{ color: info?.color || 'var(--text-primary)' }}>{info?.emoji || '🏷️'} {info?.label || t.tag}</span>
                        </td>
                        <td style={{ textAlign: 'right', padding: '0.4rem 0.5rem' }}>{t.productCount}</td>
                        <td style={{ textAlign: 'right', padding: '0.4rem 0.5rem' }}>{t.totalSold}</td>
                        <td style={{ textAlign: 'right', padding: '0.4rem 0.5rem', color: 'var(--success)' }}>${t.totalRevenue.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {importResult && (
        <div className={`admin-alert ${importResult.errors.length > 0 ? 'admin-alert-warning' : ''}`} style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 8, background: 'var(--bg-tertiary)', fontSize: '0.85rem' }}>
          ✅ Imported: {importResult.imported} | ⏭ Skipped: {importResult.skipped}
          {importResult.errors.length > 0 && (
            <div style={{ marginTop: '0.5rem', color: 'var(--error)' }}>
              {importResult.errors.map((e, i) => <div key={i}>• {e}</div>)}
            </div>
          )}
          <button onClick={() => setImportResult(null)} style={{ marginLeft: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={onSubmit} className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="admin-card-title">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
          <div className="admin-form-grid">
            <label className="form-label">
              Slug
              <input required className="form-input" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="bpc-157" />
            </label>
            <label className="form-label">
              Name
              <input required className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="BPC-157" />
            </label>
            <label className="form-label">
              Price ($)
              <input required type="number" step="0.01" className="form-input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="49.99" />
            </label>
            <label className="form-label">
              Category
              <input required className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Recovery" />
            </label>
            <label className="form-label">
              Purity
              <input required className="form-input" value={form.purity} onChange={e => setForm({ ...form, purity: e.target.value })} placeholder="20+ Servings" />
            </label>
            <label className="form-label">
              Stock
              <input required type="number" className="form-input" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
            </label>
            <label className="form-label">
              Product Tag
              <select className="form-input" value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })}>
                <option value="">No Tag</option>
                {tags.map(t => (
                  <option key={t.slug} value={t.slug}>{t.emoji} {t.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="form-label" style={{ marginTop: '0.5rem' }}>
            Image URL
            <input required className="form-input" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
          </label>
          <label className="form-label">
            Description
            <textarea required className="form-input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Product description..." />
          </label>
          {formError && <p style={{ color: 'var(--error)', marginTop: '0.5rem', fontSize: '0.85rem' }}>{formError}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary">{editingProduct ? 'Update Product' : 'Create Product'}</button>
            <button type="button" className="btn btn-secondary" onClick={onReset}>Cancel</button>
          </div>
        </form>
      )}

      {/* Bulk Tag Bar */}
      {bulkSelected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--accent-primary)', fontSize: '0.85rem' }}>
          <span style={{ fontWeight: 600 }}>{bulkSelected.size} selected</span>
          <select className="form-input" value={bulkTag} onChange={e => setBulkTag(e.target.value)} style={{ width: 'auto', fontSize: '0.82rem', padding: '0.3rem 0.5rem' }}>
            <option value="">Remove Tag</option>
            {tags.map(t => <option key={t.slug} value={t.slug}>{t.emoji} {t.label}</option>)}
          </select>
          <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={applyBulkTag} disabled={bulkApplying}>
            {bulkApplying ? 'Applying...' : 'Apply Tag'}
          </button>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setBulkSelected(new Set())}>✕ Clear</button>
        </div>
      )}

      <div className="admin-orders-table">
        <table>
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" checked={bulkSelected.size === products.length && products.length > 0} onChange={selectAllBulk} aria-label="Select all" />
              </th>
              <th>Product</th>
              <th>Slug</th>
              <th>Price</th>
              <th>Category</th>
              <th>Tag</th>
              <th>Purity</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const tagInfo = p.tag ? tagMap[p.tag] : null
              return (
                <tr key={p.id}>
                  <td>
                    <input type="checkbox" checked={bulkSelected.has(p.id)} onChange={() => toggleBulkSelect(p.id)} aria-label={`Select ${p.name}`} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={p.imageUrl} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td><code>{p.slug}</code></td>
                  <td>${p.price.toFixed(2)}</td>
                  <td><span className="admin-badge">{p.category}</span></td>
                  <td>
                    {tagInfo ? (
                      <span className="admin-badge" style={{ background: `${tagInfo.color}22`, color: tagInfo.color, border: `1px solid ${tagInfo.color}44` }}>
                        {tagInfo.emoji} {tagInfo.label}
                      </span>
                    ) : p.tag ? (
                      <span className="admin-badge" style={{ opacity: 0.5 }} title="Tag definition missing">{p.tag}</span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                  <td>{p.purity}</td>
                  <td>
                    <span style={{ color: p.stock < 20 ? 'var(--error)' : p.stock < 50 ? '#eab308' : 'var(--success)' }}>
                      {p.stock}
                    </span>
                  </td>
                  <td>
                    <span className={`order-status ${p.active ? 'status-delivered' : 'status-cancelled'}`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-action-btn" onClick={() => onEdit(p)} title="Edit">✏️</button>
                      <button className="admin-action-btn" onClick={() => onToggle(p.id, p.active)} title={p.active ? 'Disable' : 'Enable'}>
                        {p.active ? '🔒' : '🔓'}
                      </button>
                      <button className="admin-action-btn admin-action-danger" onClick={() => onDelete(p.id)} title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
