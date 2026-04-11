import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="not-found-page">
      <div>
        <span className="not-found-code">404</span>
        <h1>Page Not Found</h1>
        <p>This page doesn&apos;t exist or has been moved.</p>
        <Link href="/" className="btn btn-primary">Back to Home</Link>
      </div>
    </section>
  )
}
