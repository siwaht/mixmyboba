'use client'

import { useState, useEffect } from 'react'

interface McpTool {
  name: string
  description: string
  category: string
}

const MCP_TOOLS: McpTool[] = [
  // Auth
  { name: 'generate_admin_token', description: 'Get a JWT token for API access', category: 'Auth' },
  // Dashboard
  { name: 'get_dashboard_stats', description: 'Revenue, orders, customers, top products, low stock alerts', category: 'Dashboard' },
  // Products
  { name: 'list_products', description: 'List all products', category: 'Products' },
  { name: 'get_product', description: 'Get full product details with variants, COAs, reviews', category: 'Products' },
  { name: 'search_products', description: 'Search storefront by name/category', category: 'Products' },
  { name: 'create_product', description: 'Create product with all fields', category: 'Products' },
  { name: 'update_product', description: 'Update any product fields', category: 'Products' },
  { name: 'delete_product', description: 'Delete product permanently', category: 'Products' },
  { name: 'upload_product_image', description: 'Upload image via base64, get public URL', category: 'Products' },
  { name: 'export_products_csv', description: 'Export all products as CSV', category: 'Products' },
  // Variants
  { name: 'list_product_variants', description: 'List size/dosage variants', category: 'Variants' },
  { name: 'create_product_variant', description: 'Add variant (e.g. 5mg, 10mg)', category: 'Variants' },
  { name: 'update_product_variant', description: 'Update variant price/stock/label', category: 'Variants' },
  { name: 'delete_product_variant', description: 'Remove a variant', category: 'Variants' },
  // COAs
  { name: 'list_product_coas', description: 'List COAs for a product', category: 'COAs' },
  { name: 'create_product_coa', description: 'Add a COA with batch/purity/lab info', category: 'COAs' },
  { name: 'delete_product_coa', description: 'Remove a COA', category: 'COAs' },
  // Orders
  { name: 'list_orders', description: 'List/filter/search orders', category: 'Orders' },
  { name: 'get_order', description: 'Full order details with line items', category: 'Orders' },
  { name: 'update_order_status', description: 'Change order status', category: 'Orders' },
  { name: 'create_order', description: 'Create manual/phone/wholesale order', category: 'Orders' },
  { name: 'export_orders_csv', description: 'Export all orders as CSV', category: 'Orders' },
  // Customers
  { name: 'list_customers', description: 'List/search customers', category: 'Customers' },
  { name: 'get_customer', description: 'Full customer profile with orders & reviews', category: 'Customers' },
  { name: 'update_customer_role', description: 'Promote/demote customer↔admin', category: 'Customers' },
  { name: 'export_customers_csv', description: 'Export all customers as CSV', category: 'Customers' },
  // Inventory
  { name: 'get_inventory', description: 'Stock levels sorted by lowest first', category: 'Inventory' },
  { name: 'update_stock', description: 'Update single product stock', category: 'Inventory' },
  { name: 'bulk_update_stock', description: 'Update multiple products at once', category: 'Inventory' },
  // Coupons
  { name: 'list_coupons', description: 'List all coupons', category: 'Coupons' },
  { name: 'create_coupon', description: 'Create percent/fixed discount', category: 'Coupons' },
  { name: 'toggle_coupon', description: 'Enable/disable coupon', category: 'Coupons' },
  { name: 'delete_coupon', description: 'Delete coupon', category: 'Coupons' },
  // Reviews
  { name: 'list_reviews', description: 'List/filter reviews by product', category: 'Reviews' },
  { name: 'update_review', description: 'Toggle verified status', category: 'Reviews' },
  { name: 'delete_review', description: 'Remove a review (moderation)', category: 'Reviews' },
  // Site Content
  { name: 'get_site_settings', description: 'Get hero, badges, announcement', category: 'Site Content' },
  { name: 'update_site_settings', description: 'Update hero text, CTAs, badges, banner', category: 'Site Content' },
  // Payment Settings
  { name: 'get_payment_settings', description: 'Get Stripe/PayPal/Crypto/ACH config', category: 'Payments' },
  { name: 'update_payment_settings', description: 'Configure payment gateways', category: 'Payments' },
  // Activity Feed
  { name: 'get_recent_activity', description: 'Real-time feed of orders, reviews, signups, stock changes & alerts', category: 'Activity Feed' },
  // Analytics
  { name: 'get_analytics', description: 'Revenue trends, AOV, repeat rate, top/worst products, coupon usage', category: 'Analytics' },
]

const CATEGORIES = [...new Set(MCP_TOOLS.map(t => t.category))]

export default function McpTab() {
  const [activeSection, setActiveSection] = useState<'overview' | 'connection' | 'tools' | 'logs'>('overview')
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [serverInfo, setServerInfo] = useState<{ version: string; tools: number } | null>(null)
  const [tokenForm, setTokenForm] = useState({ email: '', password: '' })
  const [generatedToken, setGeneratedToken] = useState('')
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [copied, setCopied] = useState(false)
  const [toolFilter, setToolFilter] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [testResult, setTestResult] = useState<{ tool: string; status: string; data: string } | null>(null)
  const [testLoading, setTestLoading] = useState(false)

  // Check connection on mount
  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    setConnectionStatus('checking')
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        setConnectionStatus('connected')
        setServerInfo({ version: '2.0.0', tools: MCP_TOOLS.length })
      } else {
        setConnectionStatus('disconnected')
      }
    } catch {
      setConnectionStatus('disconnected')
    }
  }

  const generateToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setTokenLoading(true)
    setTokenError('')
    setGeneratedToken('')
    try {
      const res = await fetch('/api/admin/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenForm),
      })
      const data = await res.json()
      if (res.ok && data.token) {
        setGeneratedToken(data.token)
      } else {
        setTokenError(data.error || 'Failed to generate token. Check credentials.')
      }
    } catch {
      setTokenError('Connection failed. Is the server running?')
    }
    setTokenLoading(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const testTool = async (toolName: string) => {
    setTestLoading(true)
    setTestResult(null)
    try {
      // Test by calling the corresponding API endpoint
      let endpoint = '/api/admin/stats'
      if (toolName === 'list_products') endpoint = '/api/admin/products'
      else if (toolName === 'list_orders') endpoint = '/api/admin/orders'
      else if (toolName === 'list_customers') endpoint = '/api/admin/customers'
      else if (toolName === 'get_inventory') endpoint = '/api/admin/inventory'
      else if (toolName === 'list_coupons') endpoint = '/api/admin/coupons'
      else if (toolName === 'get_site_settings') endpoint = '/api/admin/settings'
      else if (toolName === 'get_payment_settings') endpoint = '/api/admin/payment-settings'

      const res = await fetch(endpoint)
      const data = await res.json()
      setTestResult({
        tool: toolName,
        status: res.ok ? 'success' : 'error',
        data: JSON.stringify(data, null, 2).slice(0, 500) + (JSON.stringify(data).length > 500 ? '...' : ''),
      })
    } catch {
      setTestResult({ tool: toolName, status: 'error', data: 'Connection failed' })
    }
    setTestLoading(false)
  }

  const filteredTools = MCP_TOOLS.filter(t => {
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory
    const matchesSearch = !toolFilter || t.name.toLowerCase().includes(toolFilter.toLowerCase()) || t.description.toLowerCase().includes(toolFilter.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const sections = [
    { key: 'overview' as const, label: 'Overview', icon: '🔌' },
    { key: 'connection' as const, label: 'Connection', icon: '🔑' },
    { key: 'tools' as const, label: 'Tools', icon: '🛠️' },
    { key: 'logs' as const, label: 'Quick Test', icon: '🧪' },
  ]

  const mcpConfigJson = `{
  "mcpServers": {
    "cellulalabs-admin": {
      "command": "node",
      "args": ["mcp-server/index.js"],
      "env": {
        "CELLULA_BASE_URL": "${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'}",
        "CELLULA_ADMIN_TOKEN": "${generatedToken || '<paste-token-here>'}"
      }
    }
  }
}`

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

      {/* ═══ OVERVIEW ═══ */}
      {activeSection === 'overview' && (
        <>
          {/* Status cards */}
          <div className="admin-stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card glass">
              <span className="stat-label">Server Status</span>
              <span className="stat-value" style={{ fontSize: '1.1rem' }}>
                {connectionStatus === 'checking' && '⏳ Checking...'}
                {connectionStatus === 'connected' && '🟢 Connected'}
                {connectionStatus === 'disconnected' && '🔴 Disconnected'}
              </span>
            </div>
            <div className="stat-card glass">
              <span className="stat-label">Server Version</span>
              <span className="stat-value">{serverInfo?.version || '—'}</span>
            </div>
            <div className="stat-card glass">
              <span className="stat-label">Available Tools</span>
              <span className="stat-value">{serverInfo?.tools || MCP_TOOLS.length}</span>
            </div>
            <div className="stat-card glass">
              <span className="stat-label">Protocol</span>
              <span className="stat-value" style={{ fontSize: '1.1rem' }}>MCP v1.0</span>
            </div>
          </div>

          {/* What is MCP */}
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">🤖 What is MCP?</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
              The <strong style={{ color: 'var(--text-primary)' }}>Model Context Protocol (MCP)</strong> lets AI agents 
              (like Claude, Cursor, Kiro, or custom agents) control your store directly. Instead of clicking through the admin panel, 
              an AI agent can list products, create orders, update inventory, manage coupons, and more — all through a standardized protocol.
            </p>
          </div>

          {/* Tool categories overview */}
          <div className="admin-card">
            <h3 className="admin-card-title">Tool Categories</h3>
            <div className="admin-list">
              {CATEGORIES.map(cat => {
                const count = MCP_TOOLS.filter(t => t.category === cat).length
                return (
                  <div key={cat} className="admin-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem' }}>{cat}</span>
                    <span className="admin-badge" style={{ fontSize: '0.75rem' }}>{count} tool{count !== 1 ? 's' : ''}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick start */}
          <div className="admin-card" style={{ marginTop: '1.5rem' }}>
            <h3 className="admin-card-title">⚡ Quick Start</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              <p style={{ margin: '0 0 0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>1.</strong> Go to the <strong>Connection</strong> tab and generate an admin token</p>
              <p style={{ margin: '0 0 0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>2.</strong> Copy the MCP config JSON into your AI tool&apos;s settings</p>
              <p style={{ margin: '0 0 0.5rem' }}><strong style={{ color: 'var(--text-primary)' }}>3.</strong> Your AI agent now has full admin control of the store</p>
              <p style={{ margin: 0 }}><strong style={{ color: 'var(--text-primary)' }}>4.</strong> Use the <strong>Quick Test</strong> tab to verify the connection</p>
            </div>
          </div>
        </>
      )}

      {/* ═══ CONNECTION ═══ */}
      {activeSection === 'connection' && (
        <>
          {/* Generate Token */}
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">🔑 Generate Admin Token</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Generate a JWT token for your AI agent to authenticate with the MCP server.
            </p>
            <form onSubmit={generateToken}>
              <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '1rem' }}>
                <label className="form-label">
                  Admin Email
                  <input
                    className="form-input"
                    type="email"
                    value={tokenForm.email}
                    onChange={e => setTokenForm({ ...tokenForm, email: e.target.value })}
                    placeholder="admin@cellulalabs.com"
                    required
                  />
                </label>
                <label className="form-label">
                  Password
                  <input
                    className="form-input"
                    type="password"
                    value={tokenForm.password}
                    onChange={e => setTokenForm({ ...tokenForm, password: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                </label>
              </div>
              <button className="btn btn-primary" type="submit" disabled={tokenLoading}>
                {tokenLoading ? 'Generating...' : 'Generate Token'}
              </button>
              {tokenError && (
                <p style={{ color: 'var(--error)', fontSize: '0.82rem', marginTop: '0.75rem' }}>{tokenError}</p>
              )}
            </form>
            {generatedToken && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--success)' }}>✓ Token generated</span>
                  <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }} onClick={() => copyToClipboard(generatedToken)}>
                    {copied ? '✓ Copied' : 'Copy Token'}
                  </button>
                </div>
                <code style={{ fontSize: '0.75rem', wordBreak: 'break-all', color: 'var(--text-secondary)', display: 'block' }}>
                  {generatedToken.slice(0, 40)}...{generatedToken.slice(-20)}
                </code>
              </div>
            )}
          </div>

          {/* MCP Config */}
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">📋 MCP Configuration</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Add this to your AI tool&apos;s MCP config file (e.g. <code>.kiro/settings/mcp.json</code>, <code>claude_desktop_config.json</code>, or Cursor settings).
            </p>
            <div style={{ position: 'relative' }}>
              <pre style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.78rem',
                overflow: 'auto',
                color: 'var(--text-secondary)',
                lineHeight: '1.5',
              }}>
                {mcpConfigJson}
              </pre>
              <button
                className="btn btn-secondary"
                style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                onClick={() => copyToClipboard(mcpConfigJson)}
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Connection test */}
          <div className="admin-card">
            <h3 className="admin-card-title">🔍 Connection Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>
                {connectionStatus === 'checking' && '⏳'}
                {connectionStatus === 'connected' && '🟢'}
                {connectionStatus === 'disconnected' && '🔴'}
              </span>
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>
                  {connectionStatus === 'checking' && 'Checking connection...'}
                  {connectionStatus === 'connected' && 'API Connected'}
                  {connectionStatus === 'disconnected' && 'API Disconnected'}
                </p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {connectionStatus === 'connected'
                    ? 'The admin API is reachable. MCP server can connect.'
                    : 'Make sure the site is running and you are logged in as admin.'}
                </p>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={checkConnection} style={{ fontSize: '0.82rem' }}>
              ↻ Re-check Connection
            </button>
          </div>

          {/* Supported clients */}
          <div className="admin-card" style={{ marginTop: '1.5rem' }}>
            <h3 className="admin-card-title">🔧 Supported AI Clients</h3>
            <div className="admin-list">
              {[
                { name: 'Kiro', config: '.kiro/settings/mcp.json', icon: '⚡' },
                { name: 'Claude Desktop', config: 'claude_desktop_config.json', icon: '🤖' },
                { name: 'Cursor', config: 'Settings → MCP Servers', icon: '📝' },
                { name: 'Windsurf', config: '.windsurf/mcp.json', icon: '🏄' },
                { name: 'Custom Agent', config: 'Use stdio transport', icon: '🔌' },
              ].map(client => (
                <div key={client.name} className="admin-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem' }}>{client.icon} {client.name}</span>
                  <code style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{client.config}</code>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══ TOOLS ═══ */}
      {activeSection === 'tools' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="form-input"
              placeholder="Search tools..."
              value={toolFilter}
              onChange={e => setToolFilter(e.target.value)}
              style={{ maxWidth: '250px', fontSize: '0.82rem' }}
            />
            <select
              className="form-input"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ maxWidth: '180px', fontSize: '0.82rem' }}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {filteredTools.length} of {MCP_TOOLS.length} tools
            </span>
          </div>

          {/* Tool list */}
          <div className="admin-card">
            <div className="admin-list">
              {filteredTools.map(tool => (
                <div key={tool.name} className="admin-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <code style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', display: 'block' }}>{tool.name}</code>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{tool.description}</span>
                  </div>
                  <span className="admin-badge" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{tool.category}</span>
                </div>
              ))}
              {filteredTools.length === 0 && (
                <p className="admin-empty">No tools match your search.</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══ QUICK TEST ═══ */}
      {activeSection === 'logs' && (
        <>
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">🧪 Quick API Test</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Test the underlying API endpoints that the MCP server uses. This verifies your admin access is working.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { tool: 'get_dashboard_stats', label: 'Dashboard Stats' },
                { tool: 'list_products', label: 'Products' },
                { tool: 'list_orders', label: 'Orders' },
                { tool: 'list_customers', label: 'Customers' },
                { tool: 'get_inventory', label: 'Inventory' },
                { tool: 'list_coupons', label: 'Coupons' },
                { tool: 'get_site_settings', label: 'Site Settings' },
                { tool: 'get_payment_settings', label: 'Payment Settings' },
              ].map(t => (
                <button
                  key={t.tool}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}
                  onClick={() => testTool(t.tool)}
                  disabled={testLoading}
                >
                  {testLoading && testResult === null ? '...' : t.label}
                </button>
              ))}
            </div>
          </div>

          {testResult && (
            <div className="admin-card">
              <h3 className="admin-card-title">
                {testResult.status === 'success' ? '✅' : '❌'} {testResult.tool}
              </h3>
              <pre style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.75rem',
                overflow: 'auto',
                color: testResult.status === 'success' ? 'var(--text-secondary)' : 'var(--error)',
                maxHeight: '300px',
                lineHeight: '1.4',
              }}>
                {testResult.data}
              </pre>
            </div>
          )}

          {!testResult && (
            <div className="admin-card">
              <p className="admin-empty">Click a button above to test an API endpoint.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
