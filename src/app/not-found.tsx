import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="not-found-page">
      <div>
        <span className="not-found-code">404</span>
        <h1>Oops, Nothing Here</h1>
        <p>This page doesn&apos;t exist — maybe it spilled? 🧋</p>
        <Link href="/" className="btn btn-primary">Back to Home</Link>
      </div>
    </section>
  )
}
