'use client'

import { useState } from 'react'

interface ReviewData {
  id: string
  rating: number
  title: string
  body: string
  verified: boolean
  userName: string
  createdAt: string
}

interface Props {
  productId: string
  reviews: ReviewData[]
  avgRating: number | null
  reviewCount: number
}

function Stars({ rating, size = '1rem' }: { rating: number; size?: string }) {
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export default function ReviewSection({ productId, reviews: initialReviews, avgRating: initialAvgRating, reviewCount: initialReviewCount }: Props) {
  const [reviews, setReviews] = useState(initialReviews)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Derive count and average from the live reviews state so they update after submission
  const currentReviewCount = reviews.length
  const currentAvgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : initialAvgRating

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, rating, title, body }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Failed to submit review')
      setSubmitting(false)
      return
    }

    const review = await res.json()
    setReviews(prev => [{
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      verified: review.verified,
      userName: review.user?.name || review.userName || 'You',
      createdAt: review.createdAt,
    }, ...prev])
    setShowForm(false)
    setTitle('')
    setBody('')
    setRating(5)
    setSubmitting(false)
  }

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }))

  return (
    <div className="reviews-section" id="reviews">
      <div className="reviews-header">
        <div className="reviews-summary">
          <h2>Customer Reviews</h2>
          {currentAvgRating ? (
            <div className="reviews-overview">
              <div className="reviews-avg">
                <span className="reviews-avg-num">{currentAvgRating.toFixed(1)}</span>
                <Stars rating={Math.round(currentAvgRating)} size="1.1rem" />
                <span className="reviews-count">{currentReviewCount} review{currentReviewCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="rating-bars">
                {dist.map(d => (
                  <div key={d.star} className="rating-bar-row">
                    <span className="rating-bar-label">{d.star}★</span>
                    <div className="rating-bar-track">
                      <div className="rating-bar-fill" style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="rating-bar-count">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="no-reviews-text">No reviews yet. Be the first to share your experience.</p>
          )}
        </div>
        <button className="btn btn-secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Write a Review'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="review-form glass">
          <div className="review-rating-select">
            <label>Rating</label>
            <div className="star-select">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button" className={`star-btn ${s <= rating ? 'active' : ''}`} onClick={() => setRating(s)} aria-label={`${s} star${s !== 1 ? 's' : ''}`}>★</button>
              ))}
            </div>
          </div>
          <label className="form-label">
            Title
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="form-input" placeholder="Summarize your experience" maxLength={100} />
          </label>
          <label className="form-label">
            Review
            <textarea required value={body} onChange={e => setBody(e.target.value)} className="form-input" rows={3} placeholder="Share details about the taste, quality, how you prepared it..." maxLength={1000} />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {reviews.length > 0 && (
        <div className="reviews-list">
          {reviews.map(r => (
            <div key={r.id} className="review-card">
              <div className="review-card-header">
                <Stars rating={r.rating} />
                <span className="review-author">{r.userName}</span>
                {r.verified && <span className="verified-badge">✓ Verified Purchase</span>}
                <span className="review-date">
                  {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <h4 className="review-title">{r.title}</h4>
              <p className="review-body">{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
