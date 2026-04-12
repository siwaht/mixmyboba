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
        <h1>Something Went Wrong</h1>
        <p>We spilled something behind the scenes. Let&apos;s try that again.</p>
        <button className="btn btn-primary" onClick={() => unstable_retry()}>
          Try Again
        </button>
      </div>
    </section>
  )
}
