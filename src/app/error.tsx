'use client'

import { useEffect } from 'react'

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section className="not-found-page">
      <div>
        <span className="not-found-code" aria-hidden="true">!</span>
        <h1>Something went wrong</h1>
        <p>An unexpected error occurred. Please try again.</p>
        <button className="btn btn-primary" onClick={() => unstable_retry()}>
          Try Again
        </button>
      </div>
    </section>
  )
}
