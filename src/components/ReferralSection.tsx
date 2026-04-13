'use client'

import { useState, useEffect } from 'react'

export default function ReferralSection() {
  const [data, setData] = useState<{ referralCode: string; referralCount: number; reward: string; couponsGenerated: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const [refInput, setRefInput] = useState('')
  const [applyMsg, setApplyMsg] = useState('')
  const [applyError, setApplyError] = useState('')

  useEffect(() => {
    fetch('/api/referral').then(r => r.ok ? r.json() : null).then(setData).catch(() => {})
  }, [])

  const copyCode = () => {
    if (!data) return
    navigator.clipboard.writeText(data.referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyLink = () => {
    if (!data) return
    navigator.clipboard.writeText(`${window.location.origin}/account?ref=${data.referralCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const applyReferral = async () => {
    setApplyMsg('')
    setApplyError('')
    if (!refInput.trim()) return
    const res = await fetch('/api/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: refInput.trim() }),
    })
    const d = await res.json()
    if (res.ok) {
      setApplyMsg(`${d.message} Your coupon: ${d.couponCode}`)
      setRefInput('')
    } else {
      setApplyError(d.error)
    }
  }

  if (!data) return null

  return (
    <div className="referral-section">
      <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>🎁 Referral Program — Give $10, Get $10</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        Share your code with friends. When they sign up and apply it on their Account page, you both get a $10 coupon code to use at checkout.
      </p>

      <div className="referral-code-box">
        <div className="referral-code-display">
          <span className="referral-code-label">Your Code</span>
          <code className="referral-code-value">{data.referralCode}</code>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={copyCode}>
            {copied ? '✓ Copied' : '📋 Copy Code'}
          </button>
          <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={copyLink}>
            🔗 Copy Link
          </button>
        </div>
      </div>

      <div className="referral-stats">
        <div className="referral-stat">
          <span className="referral-stat-value">{data.referralCount}</span>
          <span className="referral-stat-label">Friends Referred</span>
        </div>
      </div>

      {/* Apply someone else's code */}
      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Have a referral code from a friend?</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            className="form-input"
            value={refInput}
            onChange={e => setRefInput(e.target.value)}
            placeholder="Enter referral code"
            style={{ flex: 1, fontSize: '0.85rem' }}
          />
          <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={applyReferral}>
            Apply
          </button>
        </div>
        {applyMsg && <p style={{ color: 'var(--success)', fontSize: '0.82rem', marginTop: '0.5rem' }}>{applyMsg}</p>}
        {applyError && <p style={{ color: 'var(--error)', fontSize: '0.82rem', marginTop: '0.5rem' }}>{applyError}</p>}
      </div>

      {/* How it works */}
      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        <p style={{ fontWeight: 600, marginBottom: '0.4rem' }}>How it works:</p>
        <ol style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.7 }}>
          <li>Share your referral code or link with a friend</li>
          <li>They sign up and paste your code in the &quot;Have a referral code?&quot; box above</li>
          <li>You both receive a $10 coupon code (min. $30 order)</li>
          <li>Enter the coupon code at checkout to apply the discount</li>
        </ol>
        <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>Note: Referral codes are not coupon codes — they generate a coupon after your friend applies them.</p>
      </div>
    </div>
  )
}
