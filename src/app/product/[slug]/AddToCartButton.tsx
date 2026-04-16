'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/cartStore'
import { useToast } from '@/components/Toast'
import type { PurchaseType } from '@/lib/cartStore'

interface Variant {
  id: string
  label: string
  price: number
  stock: number
}

interface Props {
  product: { id: string; slug: string; name: string; price: number; imageUrl: string }
  variants?: Variant[]
  disabled?: boolean
}

const DISCOUNTS: Record<PurchaseType, { label: string; pct: number; badge: string }> = {
  subscribe: { label: 'Subscribe and Save', pct: 40, badge: 'Save 40%' },
  onetime:   { label: 'One-time purchase',  pct: 20, badge: 'Save 20%' },
}

export default function AddToCartButton({ product, variants = [], disabled }: Props) {
  const addItem = useCartStore(s => s.addItem)
  const showToast = useToast(s => s.show)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    variants.length > 0 ? variants[0] : null
  )
  const [qty, setQty] = useState(1)
  const [purchaseType, setPurchaseType] = useState<PurchaseType>('subscribe')

  const basePrice = selectedVariant?.price ?? product.price
  const discount = DISCOUNTS[purchaseType].pct / 100
  const currentPrice = +(basePrice * (1 - discount)).toFixed(2)
  const outOfStock = disabled || (selectedVariant && selectedVariant.stock <= 0)

  const handleAdd = () => {
    if (variants.length > 0 && !selectedVariant) {
      showToast('Please select a size first')
      return
    }
    for (let i = 0; i < qty; i++) {
      addItem({
        productId: selectedVariant ? `${product.id}__${selectedVariant.id}` : product.id,
        slug: product.slug,
        name: selectedVariant ? `${product.name} (${selectedVariant.label})` : product.name,
        price: currentPrice,
        originalPrice: basePrice,
        imageUrl: product.imageUrl,
        purchaseType,
      })
    }
    showToast(`${product.name}${selectedVariant ? ` (${selectedVariant.label})` : ''} × ${qty} added`)
    setQty(1)
  }

  return (
    <div className="add-to-cart-section">
      {/* Purchase type selector */}
      <div className="purchase-type-selector" role="radiogroup" aria-label="Purchase option">
        {(Object.entries(DISCOUNTS) as [PurchaseType, typeof DISCOUNTS[PurchaseType]][]).map(([type, info]) => (
          <label
            key={type}
            className={`purchase-type-option ${purchaseType === type ? 'active' : ''}`}
            onClick={() => setPurchaseType(type)}
          >
            <input
              type="radio"
              name="purchaseType"
              value={type}
              checked={purchaseType === type}
              onChange={() => setPurchaseType(type)}
              className="purchase-type-radio"
            />
            <span className="purchase-type-label">{info.label}</span>
            <span className="purchase-type-badge">{info.badge}</span>
          </label>
        ))}
      </div>

      {variants.length > 1 && (
        <div className="variant-selector">
          <label className="variant-label">Size</label>
          <div className="variant-options" role="radiogroup" aria-label="Select size">
            {variants.map(v => (
              <button
                key={v.id}
                className={`variant-btn ${selectedVariant?.id === v.id ? 'active' : ''} ${v.stock <= 0 ? 'out-of-stock' : ''}`}
                onClick={() => setSelectedVariant(v)}
                disabled={v.stock <= 0}
                aria-pressed={selectedVariant?.id === v.id}
              >
                <span className="variant-btn-label">{v.label}</span>
                <span className="variant-btn-price">${v.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price display with original + discounted */}
      <div className="purchase-price-display">
        <span className="purchase-price-original">${basePrice.toFixed(2)}</span>
        <span className="purchase-price-current">${currentPrice.toFixed(2)}</span>
      </div>

      <div className="qty-and-cart">
        <div className="qty-selector">
          <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="Decrease quantity">−</button>
          <span>{qty}</span>
          <button onClick={() => setQty(qty + 1)} aria-label="Increase quantity">+</button>
        </div>
        <button
          className="btn btn-primary add-to-cart-main"
          onClick={handleAdd}
          disabled={!!outOfStock}
        >
          {outOfStock ? 'Out of Stock' : `Add to Cart — $${(currentPrice * qty).toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}
