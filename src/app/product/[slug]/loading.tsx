export default function Loading() {
  return (
    <section className="product-detail">
      <div className="container" style={{ padding: '4rem 2rem' }}>
        <div className="skeleton-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          <div className="skeleton-card">
            <div className="skeleton-img" style={{ aspectRatio: '1/1' }} />
          </div>
          <div>
            <div className="skeleton-line" style={{ width: '30%', height: '14px', marginBottom: '1rem' }} />
            <div className="skeleton-line" style={{ width: '60%', height: '28px', marginBottom: '1rem' }} />
            <div className="skeleton-line" style={{ width: '25%', height: '20px', marginBottom: '2rem' }} />
            <div className="skeleton-line" style={{ width: '100%', height: '14px', marginBottom: '0.5rem' }} />
            <div className="skeleton-line" style={{ width: '90%', height: '14px', marginBottom: '0.5rem' }} />
            <div className="skeleton-line" style={{ width: '75%', height: '14px', marginBottom: '2rem' }} />
            <div className="skeleton-line" style={{ width: '100%', height: '48px' }} />
          </div>
        </div>
      </div>
    </section>
  )
}
