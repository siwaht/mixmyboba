'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/lib/cartStore'
import { useToast } from '@/components/Toast'

interface RelatedProduct {
  id: string; slug: string; name: string; price: number; imageUrl: string; purity: string; category: string
}

// Simulated viewing counter — generates a believable number based on product ID hash
function getViewerCount(productId: string): number {
  let hash = 0
  for (let i = 0; i < productId.length; i++) hash = ((hash << 5) - hash) + productId.charCodeAt(i)
  const base = 3 + Math.abs(hash % 12)
  const minute = new Date().getMinutes()
  return base + (minute % 5)
}

export default function ProductSocialProof({ productId, productSlug, stock, productName }: { productId: string; productSlug: string; stock: number; productName: string }) {
  const [viewers, setViewers] = useState(0)
  const [related, setRelated] = useState<RelatedProduct[]>([])
  const addItem = useCartStore(s => s.addItem)
  const showToast = useToast(s => s.show)

  useEffect(() => {
    setViewers(getViewerCount(productId))
    const interval = setInterval(() => {
      setViewers(getViewerCount(productId))
    }, 30000) // Update every 30s
    return () => clearInterval(interval)
  }, [productId])

  useEffect(() => {
    fetch(`/api/products/${productSlug}/related`)
      .then(r => r.json())
      .then(setRelated)
      .catch(() => {})
  }, [productSlug])

  return (
    <>
      {/* Social proof indicators */}
      <div className="social-proof-bar">
        {viewers > 0 && (
          <div className="social-proof-item">
            <span className="social-proof-dot" />
            <span>{viewers} people viewing this right now</span>
          </div>
        )}
        {stock > 0 && stock <= 20 && (
          <div className="social-proof-item urgency">
            <span>⚡ Only {stock} left in stock — order soon!</span>
          </div>
        )}
        {stock > 20 && stock <= 50 && (
          <div className="social-proof-item">
            <span>📦 Limited stock available</span>
          </div>
        )}
      </div>

      {/* Quantity discount hint */}
      <div className="qty-discount-hint">
        <span>💰</span>
        <span>First order? Use code <strong>FIRSTSIP</strong> for <strong>15% off</strong> at checkout!</span>
      </div>

      {/* Frequently Bought Together */}
      {related.length > 0 && (
        <div className="fbt-section">
          <h3>🧋 Frequently Bought Together</h3>
          <div className="fbt-grid">
            {related.map(p => (
              <div key={p.id} className="fbt-card">
                <Link href={`/product/${p.slug}`}>
                  <Image src={p.imageUrl} alt={p.name} width={60} height={60} style={{ borderRadius: 6, objectFit: 'cover' }} />
                </Link>
                <div className="fbt-info">
                  <Link href={`/product/${p.slug}`} className="fbt-name">{p.name}</Link>
                  <span className="fbt-price">${p.price.toFixed(2)}</span>
                </div>
                <button
                  className="btn btn-secondary fbt-add"
                  onClick={() => {
                    addItem({ productId: p.id, slug: p.slug, name: p.name, price: p.price, imageUrl: p.imageUrl })
                    showToast(`${p.name} added to cart`)
                  }}
                >
                  +
                </button>
              </div>
            ))}
          </div>
          <Link href={`/compare?ids=${productId},${related.map(r => r.id).join(',')}`} className="compare-link">
            📊 Compare {productName} with these products →
          </Link>
        </div>
      )}
    </>
  )
}
