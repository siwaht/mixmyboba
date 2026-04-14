'use client'

interface Stats {
  totalProducts: number; totalOrders: number; totalUsers: number
  totalRevenue: number; paidRevenue: number; lowStockProducts: number
  pendingOrders: number; paidOrders: number; shippedOrders: number
  deliveredOrders: number; cancelledOrders: number
  recentOrders: { id: string; email: string; status: string; total: number; createdAt: string; items: { product: { name: string }; quantity: number }[] }[]
  topProducts: { name: string; revenue: number; sold: number }[]
}

type Tab = 'dashboard' | 'products' | 'orders' | 'customers' | 'inventory' | 'payments' | 'coupons' | 'content' | 'webhooks' | 'mcp'

export default function DashboardTab({ stats, setTab }: { stats: Stats; setTab: (t: Tab) => void }) {
  return (
    <>
      <div className="admin-stats-grid">
        <div className="stat-card glass" onClick={() => setTab('orders')} style={{ cursor: 'pointer' }}>
          <span className="stat-label">Total Revenue</span>
          <span className="stat-value">${stats.totalRevenue.toFixed(2)}</span>
          <span className="stat-sub">Confirmed: ${stats.paidRevenue.toFixed(2)}</span>
        </div>
        <div className="stat-card glass" onClick={() => setTab('orders')} style={{ cursor: 'pointer' }}>
          <span className="stat-label">Orders</span>
          <span className="stat-value">{stats.totalOrders}</span>
          <span className="stat-sub">{stats.pendingOrders} pending</span>
        </div>
        <div className="stat-card glass" onClick={() => setTab('customers')} style={{ cursor: 'pointer' }}>
          <span className="stat-label">Customers</span>
          <span className="stat-value">{stats.totalUsers}</span>
        </div>
        <div className="stat-card glass" onClick={() => setTab('products')} style={{ cursor: 'pointer' }}>
          <span className="stat-label">Products</span>
          <span className="stat-value">{stats.totalProducts}</span>
          {stats.lowStockProducts > 0 && (
            <span className="stat-sub stat-warning">⚠ {stats.lowStockProducts} low stock</span>
          )}
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="admin-card" style={{ marginTop: '1.5rem' }}>
        <h3 className="admin-card-title">Order Pipeline</h3>
        <div className="admin-pipeline">
          {[
            { label: 'Pending', count: stats.pendingOrders, cls: 'status-pending' },
            { label: 'Paid', count: stats.paidOrders, cls: 'status-paid' },
            { label: 'Shipped', count: stats.shippedOrders, cls: 'status-shipped' },
            { label: 'Delivered', count: stats.deliveredOrders, cls: 'status-delivered' },
            { label: 'Cancelled', count: stats.cancelledOrders, cls: 'status-cancelled' },
          ].map(s => (
            <div key={s.label} className="pipeline-item">
              <span className={`order-status ${s.cls}`}>{s.label}</span>
              <span className="pipeline-count">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-grid-2" style={{ marginTop: '1.5rem' }}>
        {/* Top Products */}
        <div className="admin-card">
          <h3 className="admin-card-title">Top Products</h3>
          {stats.topProducts.length === 0 ? (
            <p className="admin-empty">No sales data yet</p>
          ) : (
            <div className="admin-list">
              {stats.topProducts.map((p, i) => (
                <div key={i} className="admin-list-item">
                  <span className="admin-list-rank">#{i + 1}</span>
                  <span className="admin-list-name">{p.name}</span>
                  <span className="admin-list-meta">{p.sold} sold</span>
                  <span className="admin-list-value">${p.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="admin-card">
          <h3 className="admin-card-title">
            Recent Orders
            <button className="admin-link-btn" onClick={() => setTab('orders')}>View All →</button>
          </h3>
          {stats.recentOrders.length === 0 ? (
            <p className="admin-empty">No orders yet</p>
          ) : (
            <div className="admin-list">
              {stats.recentOrders.slice(0, 5).map(o => (
                <div key={o.id} className="admin-list-item">
                  <code className="admin-list-id">#{o.id.slice(-6)}</code>
                  <span className="admin-list-name">{o.email}</span>
                  <span className={`order-status ${`status-${o.status}`}`}>{o.status}</span>
                  <span className="admin-list-value">${o.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
