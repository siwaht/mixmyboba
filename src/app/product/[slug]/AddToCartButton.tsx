'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/cartStore'
import { useToast } from '@/components/Toast'

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

export default function AddToCartButton({ product, variants = [], disabled }: Props) {
  const addItem = useCartStore(s => s.addItem)
  const showToast = useToast(s => s.show)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    variants.length > 0 ? variants[0] : null
  )
  const [qty, setQty] = useState(1)

  const currentPrice = selectedVariant?.price ?? product.price
  const outOfStock = disabled || (selectedVariant && selectedVariant.stock <= 0)

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) {
      addItem({
        productId: selectedVariant ? `${product.id}__${selectedVariant.id}` : product.id,
        slug: product.slug,
        name: selectedVariant ? `${product.name} (${selectedVariant.label})` : product.name,
        price: currentPrice,
        imageUrl: product.imageUrl,
      })
    }
    showToast(`${product.name}${selectedVariant ? ` (${selectedVariant.label})` : ''} × ${qty} added`)
    setQty(1)
  }

  return (
    <div className="add-to-cart-section">
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
