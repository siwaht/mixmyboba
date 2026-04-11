'use client'

interface InventoryItem {
  id: string; name: string; slug: string; stock: number; active: boolean
  category: string; price: number; totalSold: number
}

interface Props {
  inventory: InventoryItem[]
  editingStock: { id: string; stock: string } | null
  setEditingStock: (v: { id: string; stock: string } | null) => void
  onUpdateStock: (id: string, stock: number) => void
}

export default function InventoryTab({ inventory, editingStock, setEditingStock, onUpdateStock }: Props) {
  const lowStock = inventory.filter(i => i.stock < 20 && i.active)
  const outOfStock = inventory.filter(i => i.stock === 0 && i.active)
  const totalValue = inventory.reduce((sum, i) => sum + i.stock * i.price, 0)

  return (
    <>
      <div className="admin-stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card glass">
          <span className="stat-label">Total SKUs</span>
          <span className="stat-value">{inventory.length}</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-label">Inventory Value</span>
          <span className="stat-value">${totalValue.toFixed(0)}</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-label">Low Stock</span>
          <span className="stat-value" style={{ color: lowStock.length > 0 ? '#eab308' : 'var(--success)' }}>
            {lowStock.length}
          </span>
        </div>
        <div className="stat-card glass">
          <span className="stat-label">Out of Stock</span>
          <span className="stat-value" style={{ color: outOfStock.length > 0 ? 'var(--error)' : 'var(--success)' }}>
            {outOfStock.length}
          </span>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="admin-alert admin-alert-warning" style={{ marginBottom: '1.5rem' }}>
          ⚠️ Low stock alert: {lowStock.map(i => `${i.name} (${i.stock})`).join(', ')}
        </div>
      )}

      <div className="admin-orders-table">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Total Sold</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td><span className="admin-badge">{item.category}</span></td>
                <td>${item.price.toFixed(2)}</td>
                <td>
                  {editingStock?.id === item.id ? (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={editingStock.stock}
                        onChange={e => setEditingStock({ ...editingStock, stock: e.target.value })}
                        style={{ width: 80, padding: '0.3rem 0.5rem' }}
                        autoFocus
                      />
                      <button className="admin-action-btn" onClick={() => onUpdateStock(item.id, parseInt(editingStock.stock))}>✓</button>
                      <button className="admin-action-btn" onClick={() => setEditingStock(null)}>✕</button>
                    </div>
                  ) : (
                    <span className="admin-stock-indicator" data-level={item.stock === 0 ? 'out' : item.stock < 20 ? 'low' : item.stock < 50 ? 'medium' : 'good'}>
                      <span className="admin-stock-bar" style={{ width: `${Math.min(100, (item.stock / 200) * 100)}%` }} />
                      <span className="admin-stock-num">{item.stock}</span>
                    </span>
                  )}
                </td>
                <td>{item.totalSold}</td>
                <td>
                  <span className={`order-status ${item.active ? 'status-delivered' : 'status-cancelled'}`}>
                    {item.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button className="admin-action-btn" onClick={() => setEditingStock({ id: item.id, stock: String(item.stock) })} title="Edit Stock">
                    ✏️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
