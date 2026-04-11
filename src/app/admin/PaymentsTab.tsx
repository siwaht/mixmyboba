'use client'

import { useState, useEffect } from 'react'

interface PaymentSettings {
  stripe: { enabled: boolean; testMode: boolean; publishableKey: string; secretKey: string; webhookSecret: string }
  paypal: { enabled: boolean; testMode: boolean; clientId: string; clientSecret: string; webhookId: string }
  crypto: { enabled: boolean; walletAddress: string; acceptedCoins: string[]; network: string }
  ach: { enabled: boolean; bankName: string; routingNumber: string; accountNumber: string; accountName: string }
  cod: { enabled: boolean; instructions: string }
  general: { currency: string; taxRate: number; freeShippingThreshold: number }
}

interface Stats {
  totalRevenue: number; paidRevenue: number; totalOrders: number
  pendingOrders: number; paidOrders: number; shippedOrders: number
  deliveredOrders: number; cancelledOrders: number
  totalProducts: number; totalUsers: number; lowStockProducts: number
  recentOrders: { id: string; status: string; total: number; createdAt: string }[]
  topProducts: { name: string; revenue: number; sold: number }[]
}

export default function PaymentsTab({ stats }: { stats: Stats; orders: unknown[]; loadOrders: () => void }) {
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState<'overview' | 'stripe' | 'paypal' | 'crypto' | 'ach' | 'cod' | 'general'>('overview')

  useEffect(() => {
    fetch('/api/admin/payment-settings').then(r => r.json()).then(setSettings)
  }, [])

  const save = async () => {
    if (!settings) return
    setSaving(true)
    await fetch('/api/admin/payment-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const sections = [
    { key: 'overview' as const, label: 'Overview', icon: '📊' },
    { key: 'stripe' as const, label: 'Stripe', icon: '💳' },
    { key: 'paypal' as const, label: 'PayPal', icon: '🅿️' },
    { key: 'crypto' as const, label: 'Crypto', icon: '₿' },
    { key: 'ach' as const, label: 'ACH / Bank', icon: '🏦' },
    { key: 'cod' as const, label: 'Cash on Delivery', icon: '💵' },
    { key: 'general' as const, label: 'General', icon: '⚙️' },
  ]

  return (
    <div>
      {/* Sub-navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button
            key={s.key}
            className={`btn ${activeSection === s.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSection(s.key)}
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeSection === 'overview' && (
        <>
          <div className="admin-stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card glass">
              <span className="stat-label">Total Revenue</span>
              <span className="stat-value">${stats.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="stat-card glass">
              <span className="stat-label">Confirmed Revenue</span>
              <span className="stat-value">${stats.paidRevenue.toFixed(2)}</span>
            </div>
            <div className="stat-card glass">
              <span className="stat-label">Total Orders</span>
              <span className="stat-value">{stats.totalOrders}</span>
            </div>
            <div className="stat-card glass">
              <span className="stat-label">Pending Payments</span>
              <span className="stat-value">{stats.pendingOrders}</span>
            </div>
          </div>

          {/* Active payment methods */}
          <div className="admin-card">
            <h3 className="admin-card-title">Active Payment Methods</h3>
            {!settings ? (
              <p className="admin-empty">Loading...</p>
            ) : (
              <div className="admin-list">
                {[
                  { name: 'Stripe (Card)', enabled: settings.stripe.enabled, mode: settings.stripe.testMode ? 'Test' : 'Live' },
                  { name: 'PayPal', enabled: settings.paypal.enabled, mode: settings.paypal.testMode ? 'Sandbox' : 'Live' },
                  { name: 'Cryptocurrency', enabled: settings.crypto.enabled, mode: settings.crypto.network },
                  { name: 'ACH / Bank Transfer', enabled: settings.ach.enabled, mode: 'Direct' },
                  { name: 'Cash on Delivery', enabled: settings.cod?.enabled ?? false, mode: 'COD' },
                ].map(m => (
                  <div key={m.name} className="admin-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{m.name}</span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {m.enabled && <span className="admin-badge" style={{ fontSize: '0.72rem' }}>{m.mode}</span>}
                      <span className={`order-status ${m.enabled ? 'status-delivered' : 'status-cancelled'}`}>
                        {m.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Stripe */}
      {activeSection === 'stripe' && settings && (
        <div className="admin-card">
          <h3 className="admin-card-title">Stripe Configuration</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input type="checkbox" checked={settings.stripe.enabled} onChange={e => setSettings({ ...settings, stripe: { ...settings.stripe, enabled: e.target.checked } })} />
              Enable Stripe Payments
            </label>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input type="checkbox" checked={settings.stripe.testMode} onChange={e => setSettings({ ...settings, stripe: { ...settings.stripe, testMode: e.target.checked } })} />
              Test Mode {settings.stripe.testMode && <span className="admin-badge" style={{ fontSize: '0.7rem' }}>Using test keys</span>}
            </label>
          </div>
          <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <label className="form-label">
              Publishable Key
              <input className="form-input" value={settings.stripe.publishableKey} onChange={e => setSettings({ ...settings, stripe: { ...settings.stripe, publishableKey: e.target.value } })} placeholder={settings.stripe.testMode ? 'pk_test_...' : 'pk_live_...'} />
            </label>
            <label className="form-label">
              Secret Key
              <input className="form-input" type="password" value={settings.stripe.secretKey} onChange={e => setSettings({ ...settings, stripe: { ...settings.stripe, secretKey: e.target.value } })} placeholder={settings.stripe.testMode ? 'sk_test_...' : 'sk_live_...'} />
            </label>
            <label className="form-label">
              Webhook Secret
              <input className="form-input" type="password" value={settings.stripe.webhookSecret} onChange={e => setSettings({ ...settings, stripe: { ...settings.stripe, webhookSecret: e.target.value } })} placeholder="whsec_..." />
            </label>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
            Webhook endpoint: <code>{typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/stripe</code>
          </p>
        </div>
      )}

      {/* PayPal */}
      {activeSection === 'paypal' && settings && (
        <div className="admin-card">
          <h3 className="admin-card-title">PayPal Configuration</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input type="checkbox" checked={settings.paypal.enabled} onChange={e => setSettings({ ...settings, paypal: { ...settings.paypal, enabled: e.target.checked } })} />
              Enable PayPal Payments
            </label>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input type="checkbox" checked={settings.paypal.testMode} onChange={e => setSettings({ ...settings, paypal: { ...settings.paypal, testMode: e.target.checked } })} />
              Sandbox Mode {settings.paypal.testMode && <span className="admin-badge" style={{ fontSize: '0.7rem' }}>Using sandbox</span>}
            </label>
          </div>
          <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <label className="form-label">
              Client ID
              <input className="form-input" value={settings.paypal.clientId} onChange={e => setSettings({ ...settings, paypal: { ...settings.paypal, clientId: e.target.value } })} placeholder="AaBbCc..." />
            </label>
            <label className="form-label">
              Client Secret
              <input className="form-input" type="password" value={settings.paypal.clientSecret} onChange={e => setSettings({ ...settings, paypal: { ...settings.paypal, clientSecret: e.target.value } })} placeholder="EeFfGg..." />
            </label>
            <label className="form-label">
              Webhook ID
              <input className="form-input" value={settings.paypal.webhookId} onChange={e => setSettings({ ...settings, paypal: { ...settings.paypal, webhookId: e.target.value } })} placeholder="WH-..." />
            </label>
          </div>
        </div>
      )}

      {/* Crypto */}
      {activeSection === 'crypto' && settings && (
        <div className="admin-card">
          <h3 className="admin-card-title">Cryptocurrency Configuration</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input type="checkbox" checked={settings.crypto.enabled} onChange={e => setSettings({ ...settings, crypto: { ...settings.crypto, enabled: e.target.checked } })} />
              Enable Crypto Payments
            </label>
          </div>
          <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <label className="form-label">
              Wallet Address
              <input className="form-input" value={settings.crypto.walletAddress} onChange={e => setSettings({ ...settings, crypto: { ...settings.crypto, walletAddress: e.target.value } })} placeholder="0x..." style={{ fontFamily: 'monospace' }} />
            </label>
            <label className="form-label">
              Network
              <select className="form-input" value={settings.crypto.network} onChange={e => setSettings({ ...settings, crypto: { ...settings.crypto, network: e.target.value } })}>
                <option value="ERC-20">ERC-20 (Ethereum)</option>
                <option value="TRC-20">TRC-20 (Tron)</option>
                <option value="BEP-20">BEP-20 (BSC)</option>
                <option value="SOL">Solana</option>
                <option value="BTC">Bitcoin</option>
              </select>
            </label>
            <label className="form-label">
              Accepted Coins (comma-separated)
              <input className="form-input" value={settings.crypto.acceptedCoins.join(', ')} onChange={e => setSettings({ ...settings, crypto: { ...settings.crypto, acceptedCoins: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} placeholder="BTC, ETH, USDT, USDC" />
            </label>
          </div>
        </div>
      )}

      {/* ACH */}
      {activeSection === 'ach' && settings && (
        <div className="admin-card">
          <h3 className="admin-card-title">ACH / Bank Transfer Configuration</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input type="checkbox" checked={settings.ach.enabled} onChange={e => setSettings({ ...settings, ach: { ...settings.ach, enabled: e.target.checked } })} />
              Enable ACH / Bank Transfer
            </label>
          </div>
          <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label className="form-label">
              Bank Name
              <input className="form-input" value={settings.ach.bankName} onChange={e => setSettings({ ...settings, ach: { ...settings.ach, bankName: e.target.value } })} placeholder="Chase, Wells Fargo..." />
            </label>
            <label className="form-label">
              Account Name
              <input className="form-input" value={settings.ach.accountName} onChange={e => setSettings({ ...settings, ach: { ...settings.ach, accountName: e.target.value } })} placeholder="Business Name LLC" />
            </label>
            <label className="form-label">
              Routing Number
              <input className="form-input" type="password" value={settings.ach.routingNumber} onChange={e => setSettings({ ...settings, ach: { ...settings.ach, routingNumber: e.target.value } })} placeholder="021000021" />
            </label>
            <label className="form-label">
              Account Number
              <input className="form-input" type="password" value={settings.ach.accountNumber} onChange={e => setSettings({ ...settings, ach: { ...settings.ach, accountNumber: e.target.value } })} placeholder="123456789" />
            </label>
          </div>
        </div>
      )}

      {/* Cash on Delivery */}
      {activeSection === 'cod' && settings && (
        <div className="admin-card">
          <h3 className="admin-card-title">Cash on Delivery Configuration</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input type="checkbox" checked={settings.cod?.enabled ?? false} onChange={e => setSettings({ ...settings, cod: { ...(settings.cod || { instructions: '' }), enabled: e.target.checked } })} />
              Enable Cash on Delivery
            </label>
          </div>
          <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <label className="form-label">
              Customer Instructions
              <textarea className="form-input" rows={3} value={settings.cod?.instructions ?? ''} onChange={e => setSettings({ ...settings, cod: { ...(settings.cod || { enabled: false }), instructions: e.target.value } })} placeholder="Pay with cash when your order is delivered to your doorstep." />
            </label>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
            Customers will pay in cash when the order is delivered. No online payment is collected at checkout.
          </p>
        </div>
      )}

      {/* General */}
      {activeSection === 'general' && settings && (
        <div className="admin-card">
          <h3 className="admin-card-title">General Payment Settings</h3>
          <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <label className="form-label">
              Currency
              <select className="form-input" value={settings.general.currency} onChange={e => setSettings({ ...settings, general: { ...settings.general, currency: e.target.value } })}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
            </label>
            <label className="form-label">
              Tax Rate (%)
              <input className="form-input" type="number" step="0.01" value={settings.general.taxRate} onChange={e => setSettings({ ...settings, general: { ...settings.general, taxRate: parseFloat(e.target.value) || 0 } })} />
            </label>
            <label className="form-label">
              Free Shipping Threshold ($)
              <input className="form-input" type="number" step="1" value={settings.general.freeShippingThreshold} onChange={e => setSettings({ ...settings, general: { ...settings.general, freeShippingThreshold: parseFloat(e.target.value) || 0 } })} />
            </label>
          </div>
        </div>
      )}

      {/* Save button */}
      {activeSection !== 'overview' && settings && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Payment Settings'}
          </button>
          {saved && <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>✓ Settings saved</span>}
        </div>
      )}
    </div>
  )
}
