'use client'

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#0d0d0d', color: '#e0e0e0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ color: '#999', marginBottom: '2rem' }}>A critical error occurred.</p>
          <button
            onClick={() => unstable_retry()}
            style={{ padding: '0.8rem 2rem', background: '#d4b896', color: '#0d0d0d', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
