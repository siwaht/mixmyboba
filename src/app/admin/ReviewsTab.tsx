'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'


interface AdminReview {
  id: string
  productId: string
  rating: number
  title: string
  body: string
  displayName: string | null
  verified: boolean
  createdAt: string
  user: { name: string | null; email: string }
  product: { name: string; slug: string }
}

type Filter = 'all' | 'verified' | 'unverified'

/**
 * Review moderation.
 *
 * Reviews render publicly on product pages and feed the aggregate rating in
 * search results, so they need a place to be verified or removed.
 */
export default function ReviewsTab() {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  // Bumped by the refresh button to re-run the fetch below.
  const [reloadToken, setReloadToken] = useState(0)
  const reload = useCallback(() => setReloadToken(t => t + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/admin/reviews', { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error('Admin access required to load reviews.')
        return r.json()
      })
      .then((data: AdminReview[]) => {
        setReviews(Array.isArray(data) ? data : [])
        setError('')
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return
        setError(e instanceof Error ? e.message : 'Failed to load reviews.')
        setLoading(false)
      })

    return () => controller.abort()
  }, [reloadToken])

  const toggleVerified = async (review: AdminReview) => {
    setBusyId(review.id)
    setError('')
    const res = await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId: review.id, verified: !review.verified }),
    })
    setBusyId(null)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Failed to update review')
      return
    }
    const updated: AdminReview = await res.json()
    setReviews(prev => prev.map(r => (r.id === updated.id ? updated : r)))
  }

  const deleteReview = async (review: AdminReview) => {
    if (!confirm(`Delete "${review.title}" by ${review.displayName || review.user.name || review.user.email}?`)) return
    setBusyId(review.id)
    setError('')
    const res = await fetch('/api/admin/reviews', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId: review.id }),
    })
    setBusyId(null)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Failed to delete review')
      return
    }
    setReviews(prev => prev.filter(r => r.id !== review.id))
  }

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return reviews.filter(r => {
      if (filter === 'verified' && !r.verified) return false
      if (filter === 'unverified' && r.verified) return false
      if (!term) return true
      return (
        r.title.toLowerCase().includes(term) ||
        r.body.toLowerCase().includes(term) ||
        r.product.name.toLowerCase().includes(term) ||
        r.user.email.toLowerCase().includes(term) ||
        (r.displayName || '').toLowerCase().includes(term)
      )
    })
  }, [reviews, filter, search])

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0
  const unverifiedCount = reviews.filter(r => !r.verified).length

  return (
    <>
      <div className="admin-toolbar">
        <span className="admin-toolbar-count">
          {reviews.length} reviews
          {reviews.length > 0 && <> · avg {avgRating.toFixed(1)}★ · {unverifiedCount} unverified</>}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="form-input"
            style={{ width: 220, fontSize: '0.85rem' }}
            placeholder="Search reviews..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search reviews"
          />
          <select
            className="form-input"
            style={{ width: 'auto', fontSize: '0.85rem' }}
            value={filter}
            onChange={e => setFilter(e.target.value as Filter)}
            aria-label="Filter reviews"
          >
            <option value="all">All</option>
            <option value="verified">Verified only</option>
            <option value="unverified">Unverified only</option>
          </select>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
            onClick={reload}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && (
        <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1rem' }} role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading reviews...</p>
      ) : visible.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          {reviews.length === 0 ? 'No reviews have been submitted yet.' : 'No reviews match this filter.'}
        </div>
      ) : (
        <div className="admin-orders-table">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Reviewer</th>
                <th>Date</th>
                <th>Verified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(r => (
                <tr key={r.id} style={{ opacity: busyId === r.id ? 0.5 : 1 }}>
                  <td>
                    <a href={`/product/${r.product.slug}`} target="_blank" rel="noopener noreferrer">
                      {r.product.name}
                    </a>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }} aria-label={`${r.rating} out of 5`}>
                    {'★'.repeat(r.rating)}
                    <span style={{ color: 'var(--text-muted)' }}>{'☆'.repeat(5 - r.rating)}</span>
                  </td>
                  <td style={{ maxWidth: 340 }}>
                    <strong style={{ display: 'block' }}>{r.title}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.body}</span>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>
                    <div>{r.displayName || r.user.name || '—'}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{r.user.email}</div>
                  </td>
                  <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`order-status ${r.verified ? 'status-delivered' : 'status-pending'}`}>
                      {r.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="admin-action-btn"
                        title={r.verified ? 'Remove verified badge' : 'Mark as verified purchase'}
                        onClick={() => toggleVerified(r)}
                        disabled={busyId === r.id}
                      >
                        {r.verified ? '↩️' : '✅'}
                      </button>
                      <button
                        className="admin-action-btn admin-action-danger"
                        title="Delete review"
                        onClick={() => deleteReview(r)}
                        disabled={busyId === r.id}
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
    </>
  )
}
