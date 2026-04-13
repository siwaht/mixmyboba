'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('bulk')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For now, open mailto with pre-filled fields
    const mailtoSubject = encodeURIComponent(
      subject === 'bulk' ? `Bulk Order Inquiry from ${name}` :
      subject === 'custom' ? `Custom Flavor Request from ${name}` :
      `${subject} — ${name}`
    )
    const mailtoBody = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)
    window.location.href = `mailto:hello@mixmyboba.com?subject=${mailtoSubject}&body=${mailtoBody}`
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <section className="checkout-section">
        <div className="container checkout-success">
          <div className="success-icon" aria-hidden="true">📬</div>
          <h1>Message Sent</h1>
          <p className="success-msg">Your email client should have opened with your message. If it didn&apos;t, you can reach us directly at <a href="mailto:hello@mixmyboba.com">hello@mixmyboba.com</a>.</p>
          <Link href="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="checkout-section">
      <div className="container" style={{ maxWidth: 640 }}>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)' }}>Contact</span>
        </nav>
        <h1 style={{ marginBottom: '0.5rem' }}>Get in Touch</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Bulk orders, custom flavors, partnerships, or just want to say hi? We&apos;d love to hear from you.
        </p>

        <form onSubmit={handleSubmit} className="checkout-form glass">
          <label className="form-label">
            Name
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="form-input" placeholder="Your name" autoComplete="name" />
          </label>
          <label className="form-label">
            Email
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="form-input" placeholder="you@example.com" autoComplete="email" />
          </label>
          <label className="form-label">
            Subject
            <select value={subject} onChange={e => setSubject(e.target.value)} className="form-input">
              <option value="bulk">Bulk / Wholesale Order</option>
              <option value="custom">Custom Flavor Request</option>
              <option value="partnership">Partnership / Collaboration</option>
              <option value="support">Order Support</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="form-label">
            Message
            <textarea required value={message} onChange={e => setMessage(e.target.value)} className="form-input" rows={5} placeholder="Tell us what you need..." />
          </label>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Send Message
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Or email us directly at <a href="mailto:hello@mixmyboba.com">hello@mixmyboba.com</a>
        </p>
      </div>
    </section>
  )
}
