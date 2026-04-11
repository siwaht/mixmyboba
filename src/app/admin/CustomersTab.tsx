'use client'

import { useState, useRef } from 'react'

interface Customer {
  id: string; email: string; name: string | null; role: string; createdAt: string
  orders: { id: string; total: number; status: string }[]
}

interface Props {
  customers: Customer[]
  search: string
  setSearch: (v: string) => void
  onUpdateRole: (id: string, role: string) => void
}

export default function CustomersTab({ customers, search, setSearch, onUpdateRole }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const [importing, setImporting] = useState(false)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/admin/import/customers', { method: 'POST', body: formData })
      const data = await res.json()
      setImportResult(data)
      window.location.reload()
    } catch {
      setImportResult({ imported: 0, skipped: 0, errors: ['Upload failed'] })
    }
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <div className="admin-toolbar">
        <input
          className="form-input"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 300, padding: '0.5rem 0.75rem' }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="admin-toolbar-count">{customers.length} customers</span>
          <a href="/api/admin/export/customers" className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem', textDecoration: 'none' }}>
            📥 Export CSV
          </a>
          <button className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }} onClick={() => fileRef.current?.click()} disabled={importing}>
            {importing ? '⏳ Importing...' : '📤 Import CSV'}
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
        </div>
      </div>

      {importResult && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 8, background: 'var(--bg-tertiary)', fontSize: '0.85rem' }}>
          ✅ Imported: {importResult.imported} | ⏭ Skipped: {importResult.skipped}
          {importResult.errors.length > 0 && (
            <div style={{ marginTop: '0.5rem', color: 'var(--error)' }}>
              {importResult.errors.map((e, i) => <div key={i}>• {e}</div>)}
            </div>
          )}
          <button onClick={() => setImportResult(null)} style={{ marginLeft: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {customers.length === 0 ? (
        <div className="admin-card"><p className="admin-empty">No customers found</p></div>
      ) : (
        <div className="admin-orders-table">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Role</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => {
                const totalSpent = c.orders.reduce((sum, o) => sum + o.total, 0)
                return (
                  <tr key={c.id}>
                    <td>{c.name || '—'}</td>
                    <td>{c.email}</td>
                    <td>
                      <span className={`order-status ${c.role === 'admin' ? 'status-paid' : 'status-pending'}`}>
                        {c.role}
                      </span>
                    </td>
                    <td>{c.orders.length}</td>
                    <td>${totalSpent.toFixed(2)}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <select
                        value={c.role}
                        onChange={e => onUpdateRole(c.id, e.target.value)}
                        className="form-input"
                        style={{ padding: '0.3rem', fontSize: '0.78rem', width: 100 }}
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
