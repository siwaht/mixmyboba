'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/lib/cartStore'
import { useToast } from './Toast'
import { useProductTags } from '@/lib/useProductTags'

interface Product {
  id: string
  slug: string
  name: string
  price: number
  description: string
  imageUrl: string
  category: string
  purity: string
  tag?: string | null
  avgRating?: number | null
  reviewCount?: number
  startingPrice?: number
  variants?: { label: string; price: number }[]
}

export default function ProductCard({ product }: { product: Product }) {
  const items = useCartStore(s => s.items)
  const addItem = useCartStore(s => s.addItem)
  const updateQuantity = useCartStore(s => s.updateQuantity)
  const removeItem = useCartStore(s => s.removeItem)
  const showToast = useToast(s => s.show)
  const { getTag } = useProductTags()

  const cartItem = items.find(i => i.productId === product.id)
  const qty = cartItem?.quantity || 0

  const handleAdd = () => {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.startingPrice || product.price,
      imageUrl: product.imageUrl,
    })
    showToast(`${product.name} added to cart`)
  }

  const handleIncrement = () => {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.startingPrice || product.price,
      imageUrl: product.imageUrl,
    })
  }

  const handleDecrement = () => {
    if (qty <= 1) {
      removeItem(product.id)
    } else {
      updateQuantity(product.id, qty - 1)
    }
  }

  const displayPrice = product.startingPrice || product.price
  const hasVariants = product.variants && product.variants.length > 1
  const tagInfo = product.tag ? getTag(product.tag) : null

  return (
    <article className="product-card">
      <Link href={`/product/${product.slug}`} className="product-img-wrap" aria-label={`View ${product.name} details`}>
        <Image
          src={product.imageUrl}
          alt={`${product.name} — premium boba tea mix`}
          width={480}
          height={300}
          sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PC9zdmc+"
        />
        <span className="purity-badge" aria-label={`${product.purity}`}>{product.purity}</span>
        {tagInfo && (
          <span
            className="product-tag"
            style={{
              background: `linear-gradient(135deg, ${tagInfo.color}e6, ${tagInfo.color}cc)`,
              border: `1px solid ${tagInfo.color}66`,
              boxShadow: `0 2px 12px ${tagInfo.color}4d`,
            }}
            aria-label={tagInfo.label}
          >
            {tagInfo.label}
          </span>
        )}
      </Link>
      <div className="product-info">
        <Link href={`/product/${product.slug}`}>
          <h3 className="product-title">{product.name}</h3>
        </Link>
        {product.avgRating != null && product.reviewCount != null && product.reviewCount > 0 && (
          <div className="product-card-rating" aria-label={`Rated ${product.avgRating.toFixed(1)} out of 5 stars from ${product.reviewCount} reviews`}>
            <span className="stars-sm" aria-hidden="true">
              {'★'.repeat(Math.round(product.avgRating))}{'☆'.repeat(5 - Math.round(product.avgRating))}
            </span>
            <span className="rating-count-sm">({product.reviewCount})</span>
          </div>
        )}
        <div className="product-price">
          {hasVariants ? `From $${displayPrice.toFixed(2)}` : `$${displayPrice.toFixed(2)}`}
        </div>
        <p className="product-desc">{product.description}</p>
        <div className="product-meta">
          <span className="product-meta-cat">
            <span>{product.category}</span>
          </span>
        </div>

        {qty === 0 ? (
          <button className="add-to-cart-btn" onClick={handleAdd} aria-label={`Add ${product.name} to cart`}>
            Add to Cart
          </button>
        ) : (
          <div className="card-qty-stepper">
            <button className="card-qty-btn" onClick={handleDecrement} aria-label="Decrease quantity">−</button>
            <span className="card-qty-value">{qty}</span>
            <button className="card-qty-btn" onClick={handleIncrement} aria-label="Increase quantity">+</button>
          </div>
        )}
      </div>
    </article>
  )
}
