'use client'

import { useState, useEffect, useCallback } from 'react'

interface WebhookEndpoint {
  id: string
  url: string
  label: string
  events: string[]
  active: boolean
  createdAt: string
}

interface WebhookEventConfig {
  enabled: boolean
  description: string
}

interface WebhookSettings {
  enabled: boolean
  secret: string
  endpoints: WebhookEndpoint[]
  events: Record<string, WebhookEventConfig>
  lowStockThreshold: number
  retryAttempts: number
  timeoutMs: number
}

interface WebhookDelivery {
  id: string
  event: string
  endpoint: string
  status: 'success' | 'failed'
  statusCode?: number
  timestamp: string
  duration: number
  error?: string
}

const EVENT_ICONS: Record<string, string> = {
  'customer.registered': '👤',
  'order.created': '🛒',
  'order.status_changed': '📦',
  'order.cancelled': '❌',
  'inventory.low_stock': '⚠️',
  'inventory.out_of_stock': '🚫',
  'review.created': '⭐',
  'product.updated': '✏️',
  'product.created': '➕',
  'product.deleted': '🗑️',
}

const EVENT_CATEGORIES: Record<string, string[]> = {
  'Orders': ['order.created', 'order.status_changed', 'order.cancelled'],
  'Customers': ['customer.registered'],
  'Inventory': ['inventory.low_stock', 'inventory.out_of_stock'],
  'Products': ['product.created', 'product.updated', 'product.deleted'],
  'Reviews': ['review.created'],
}

export default function WebhooksTab() {
  const [activeSection, setActiveSection] = useState<'overview' | 'endpoints' | 'events' | 'logs' | 'guide'>('overview')
  const [settings, setSettings] = useState<WebhookSettings | null>(null)
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ url: string; success: boolean; statusCode?: number; error?: string } | null>(null)

  // Endpoint form
  const [showEndpointForm, setShowEndpointForm] = useState(false)
  const [endpointForm, setEndpointForm] = useState({ label: '', url: '', events: ['*'] as string[] })
  const [editingEndpoint, setEditingEndpoint] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/webhooks')
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
        setDeliveries(data.deliveries || [])
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (newSettings?: WebhookSettings) => {
    const toSave = newSettings || settings
    if (!toSave) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/webhooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  const testEndpoint = async (url: string) => {
    setTesting(url)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      setTestResult({ url, ...data })
    } catch {
      setTestResult({ url, success: false, error: 'Connection failed' })
    }
    setTesting(null)
  }

  const addEndpoint = () => {
    if (!settings || !endpointForm.url) return
    const newEndpoint: WebhookEndpoint = {
      id: editingEndpoint || `ep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      url: endpointForm.url.trim(),
      label: endpointForm.label.trim() || new URL(endpointForm.url.trim()).hostname,
      events: endpointForm.events,
      active: true,
      createdAt: new Date().toISOString(),
    }

    let updated: WebhookSettings
    if (editingEndpoint) {
      updated = { ...settings, endpoints: settings.endpoints.map(ep => ep.id === editingEndpoint ? { ...newEndpoint, createdAt: ep.createdAt } : ep) }
    } else {
      updated = { ...settings, endpoints: [...settings.endpoints, newEndpoint] }
    }

    setSettings(updated)
    save(updated)
    resetForm()
  }

  const removeEndpoint = (id: string) => {
    if (!settings) return
    const updated = { ...settings, endpoints: settings.endpoints.filter(ep => ep.id !== id) }
    setSettings(updated)
    save(updated)
  }

  const toggleEndpoint = (id: string) => {
    if (!settings) return
    const updated = { ...settings, endpoints: settings.endpoints.map(ep => ep.id === id ? { ...ep, active: !ep.active } : ep) }
    setSettings(updated)
    save(updated)
  }

  const startEdit = (ep: WebhookEndpoint) => {
    setEditingEndpoint(ep.id)
    setEndpointForm({ label: ep.label, url: ep.url, events: ep.events })
    setShowEndpointForm(true)
  }

  const resetForm = () => {
    setShowEndpointForm(false)
    setEditingEndpoint(null)
    setEndpointForm({ label: '', url: '', events: ['*'] })
  }

  const toggleEventForForm = (event: string) => {
    setEndpointForm(prev => {
      if (event === '*') return { ...prev, events: ['*'] }
      const without = prev.events.filter(e => e !== '*' && e !== event)
      if (prev.events.includes(event)) return { ...prev, events: without.length ? without : ['*'] }
      return { ...prev, events: [...without, event] }
    })
  }

  const toggleGlobalEvent = (eventKey: string) => {
    if (!settings) return
    const updated = {
      ...settings,
      events: {
        ...settings.events,
        [eventKey]: { ...settings.events[eventKey], enabled: !settings.events[eventKey]?.enabled },
      },
    }
    setSettings(updated)
    save(updated)
  }

  const sections = [
    { key: 'overview' as const, label: 'Overview', icon: '🔔' },
    { key: 'endpoints' as const, label: 'Endpoints', icon: '🔗' },
    { key: 'events' as const, label: 'Events', icon: '⚡' },
    { key: 'logs' as const, label: 'Delivery Log', icon: '📋' },
    { key: 'guide' as const, label: 'n8n Guide', icon: '📖' },
  ]

  if (!settings) {
    return <div className="admin-empty">Loading webhook settings...</div>
  }

  const activeEndpoints = settings.endpoints.filter(ep => ep.active).length
  const enabledEvents = Object.values(settings.events).filter(e => e.enabled).length
  const recentSuccesses = deliveries.filter(d => d.status === 'success').length
  const recentFailures = deliveries.filter(d => d.status === 'failed').length

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

      {/* Save indicator */}
      {saved && (
        <div style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--success)' }}>
          ✓ Settings saved
        </div>
      )}

      {/* ═══ OVERVIEW ═══ */}
      {activeSection === 'overview' && (
        <>
          {/* Master toggle */}
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="admin-card-title" style={{ marginBottom: '0.25rem' }}>Webhook System</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Send real-time notifications to n8n, Zapier, Make, or any webhook URL when events happen in your store.
                </p>
              </div>
              <button
                className={`btn ${settings.enabled ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { const updated = { ...settings, enabled: !settings.enabled }; setSettings(updated); save(updated) }}
                style={{ fontSize: '0.82rem', minWidth: '100px' }}
              >
                {settings.enabled ? '🟢 Enabled' : '🔴 Disabled'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="admin-stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card glass">
              <span className="stat-label">Status</span>
              <span className="stat-value" style={{ fontSize: '1.1rem' }}>
                {settings.enabled ? '🟢 Active' : '🔴 Off'}
              </span>
            </div>
            <div className="stat-card glass">
              <span className="stat-label">Endpoints</span>
              <span className="stat-value">{activeEndpoints} / {settings.endpoints.length}</span>
              <span className="stat-sub">active</span>
            </div>
            <div className="stat-card glass">
              <span className="stat-label">Events Enabled</span>
              <span className="stat-value">{enabledEvents} / {Object.keys(settings.events).length}</span>
            </div>
            <div className="stat-card glass">
              <span className="stat-label">Recent Deliveries</span>
              <span className="stat-value">
                <span style={{ color: 'var(--success)' }}>{recentSuccesses}✓</span>
                {recentFailures > 0 && <span style={{ color: 'var(--error)', marginLeft: '0.5rem' }}>{recentFailures}✗</span>}
              </span>
            </div>
          </div>

          {/* How it works */}
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">🔔 How Webhooks Work</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
              When something happens in your store (new order, customer signup, low stock, etc.), the system sends an HTTP POST
              with the event details to your configured URLs. Connect these to <strong style={{ color: 'var(--text-primary)' }}>n8n</strong>,
              <strong style={{ color: 'var(--text-primary)' }}> Zapier</strong>, or <strong style={{ color: 'var(--text-primary)' }}>Make</strong> to
              build automated workflows — send confirmation emails, notify your team on Slack, alert suppliers about low stock, update spreadsheets, and more.
            </p>
          </div>

          {/* Quick setup */}
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">⚡ Quick Setup</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              <p style={{ margin: '0 0 0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>1.</strong> Go to <strong>Endpoints</strong> and add your n8n webhook URL</p>
              <p style={{ margin: '0 0 0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>2.</strong> Choose which <strong>Events</strong> should trigger notifications</p>
              <p style={{ margin: '0 0 0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>3.</strong> Use the <strong>Test</strong> button to verify the connection</p>
              <p style={{ margin: 0 }}><strong style={{ color: 'var(--text-primary)' }}>4.</strong> Check the <strong>n8n Guide</strong> tab for workflow examples</p>
            </div>
          </div>

          {/* Supported events overview */}
          <div className="admin-card">
            <h3 className="admin-card-title">Supported Events</h3>
            <div className="admin-list">
              {Object.entries(settings.events).map(([key, config]) => (
                <div key={key} className="admin-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span>{EVENT_ICONS[key] || '📡'}</span>
                    <div>
                      <code style={{ fontSize: '0.82rem', color: 'var(--accent-primary)' }}>{key}</code>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '0.75rem' }}>{config.description}</span>
                    </div>
                  </div>
                  <span className="admin-badge" style={{ fontSize: '0.7rem', color: config.enabled ? 'var(--success)' : 'var(--text-muted)' }}>
                    {config.enabled ? '● ON' : '○ OFF'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══ ENDPOINTS ═══ */}
      {activeSection === 'endpoints' && (
        <>
          {/* Secret key */}
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">🔐 Webhook Secret</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Optional HMAC-SHA256 signing secret. If set, every webhook includes an <code>X-Webhook-Signature</code> header so your receiver can verify authenticity.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <label className="form-label" style={{ flex: 1 }}>
                Secret Key
                <input
                  className="form-input"
                  type="text"
                  value={settings.secret}
                  onChange={e => setSettings({ ...settings, secret: e.target.value })}
                  placeholder="Enter a secret key or generate one..."
                  style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
                />
              </label>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                onClick={() => {
                  const secret = `whsec_${Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('')}`
                  setSettings({ ...settings, secret })
                }}
              >
                Generate
              </button>
              <button className="btn btn-primary" style={{ fontSize: '0.78rem' }} onClick={() => save()} disabled={saving}>
                {saving ? '...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Advanced settings */}
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">⚙️ Delivery Settings</h3>
            <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <label className="form-label">
                Low Stock Threshold
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={settings.lowStockThreshold}
                  onChange={e => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 20 })}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Alert when stock falls below this</span>
              </label>
              <label className="form-label">
                Retry Attempts
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  max="5"
                  value={settings.retryAttempts}
                  onChange={e => setSettings({ ...settings, retryAttempts: parseInt(e.target.value) || 3 })}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Times to retry on failure</span>
              </label>
              <label className="form-label">
                Timeout (ms)
                <input
                  className="form-input"
                  type="number"
                  min="1000"
                  step="1000"
                  value={settings.timeoutMs}
                  onChange={e => setSettings({ ...settings, timeoutMs: parseInt(e.target.value) || 10000 })}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Max wait per request</span>
              </label>
            </div>
            <button className="btn btn-primary" style={{ fontSize: '0.82rem', marginTop: '1rem' }} onClick={() => save()} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {/* Add endpoint */}
          <div className="admin-toolbar">
            <span className="admin-toolbar-count">{settings.endpoints.length} endpoint{settings.endpoints.length !== 1 ? 's' : ''} configured</span>
            <button className="btn btn-primary" style={{ fontSize: '0.82rem' }} onClick={() => { resetForm(); setShowEndpointForm(true) }}>
              + Add Endpoint
            </button>
          </div>

          {/* Endpoint form */}
          {showEndpointForm && (
            <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
              <h3 className="admin-card-title">{editingEndpoint ? '✏️ Edit Endpoint' : '➕ New Endpoint'}</h3>
              <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 2fr', marginBottom: '1rem' }}>
                <label className="form-label">
                  Label
                  <input
                    className="form-input"
                    value={endpointForm.label}
                    onChange={e => setEndpointForm({ ...endpointForm, label: e.target.value })}
                    placeholder="e.g. n8n Production"
                  />
                </label>
                <label className="form-label">
                  Webhook URL
                  <input
                    className="form-input"
                    value={endpointForm.url}
                    onChange={e => setEndpointForm({ ...endpointForm, url: e.target.value })}
                    placeholder="https://your-n8n.com/webhook/abc123"
                    style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
                  />
                </label>
              </div>

              {/* Event selection */}
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Subscribe to events:</span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  <button
                    className={`btn ${endpointForm.events.includes('*') ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    onClick={() => toggleEventForForm('*')}
                  >
                    📡 All Events
                  </button>
                </div>
                {Object.entries(EVENT_CATEGORIES).map(([category, events]) => (
                  <div key={category} style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{category}</span>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      {events.map(ev => (
                        <button
                          key={ev}
                          className={`btn ${!endpointForm.events.includes('*') && endpointForm.events.includes(ev) ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', opacity: endpointForm.events.includes('*') ? 0.5 : 1 }}
                          onClick={() => toggleEventForForm(ev)}
                          disabled={endpointForm.events.includes('*')}
                        >
                          {EVENT_ICONS[ev]} {ev.split('.')[1]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" style={{ fontSize: '0.82rem' }} onClick={addEndpoint}>
                  {editingEndpoint ? 'Update Endpoint' : 'Add Endpoint'}
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '0.82rem' }} onClick={resetForm}>Cancel</button>
              </div>
            </div>
          )}

          {/* Endpoint list */}
          {settings.endpoints.length === 0 && !showEndpointForm && (
            <div className="admin-card">
              <p className="admin-empty">No webhook endpoints configured yet. Add one to start receiving notifications.</p>
            </div>
          )}

          {settings.endpoints.map(ep => (
            <div key={ep.id} className="admin-card" style={{ marginBottom: '1rem', opacity: ep.active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '1rem' }}>{ep.active ? '🟢' : '⚪'}</span>
                    <strong style={{ fontSize: '0.9rem' }}>{ep.label}</strong>
                  </div>
                  <code style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', wordBreak: 'break-all', display: 'block', marginBottom: '0.5rem' }}>
                    {ep.url}
                  </code>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {ep.events.includes('*')
                      ? <span className="admin-badge" style={{ fontSize: '0.7rem' }}>📡 All Events</span>
                      : ep.events.map(ev => (
                        <span key={ev} className="admin-badge" style={{ fontSize: '0.68rem' }}>
                          {EVENT_ICONS[ev] || '📡'} {ev}
                        </span>
                      ))
                    }
                  </div>
                </div>
                <div className="admin-actions" style={{ flexShrink: 0 }}>
                  <button
                    className="admin-action-btn"
                    title="Test"
                    onClick={() => testEndpoint(ep.url)}
                    disabled={testing === ep.url}
                  >
                    {testing === ep.url ? '⏳' : '🧪'}
                  </button>
                  <button className="admin-action-btn" title="Edit" onClick={() => startEdit(ep)}>✏️</button>
                  <button
                    className="admin-action-btn"
                    title={ep.active ? 'Disable' : 'Enable'}
                    onClick={() => toggleEndpoint(ep.id)}
                  >
                    {ep.active ? '⏸️' : '▶️'}
                  </button>
                  <button
                    className="admin-action-btn admin-action-danger"
                    title="Delete"
                    onClick={() => { if (confirm('Remove this endpoint?')) removeEndpoint(ep.id) }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {testResult && testResult.url === ep.url && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  background: testResult.success ? 'rgba(0,255,136,0.06)' : 'rgba(251,113,133,0.06)',
                  border: `1px solid ${testResult.success ? 'rgba(0,255,136,0.2)' : 'rgba(251,113,133,0.2)'}`,
                  color: testResult.success ? 'var(--success)' : 'var(--error)',
                }}>
                  {testResult.success
                    ? `✓ Test successful — HTTP ${testResult.statusCode}`
                    : `✗ Test failed — ${testResult.error || `HTTP ${testResult.statusCode}`}`
                  }
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
