export default function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '1rem' }}>
      <div className="loading-spinner" aria-label="Loading page" />
      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Brewing...</span>
    </div>
  )
}
