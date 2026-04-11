'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from './ProductCard'

interface Product {
  id: string
  slug: string
  name: string
  price: number
  description: string
  imageUrl: string
  category: string
  purity: string
}

interface Props {
  initialProducts?: Product[]
}

function SkeletonCards() {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-img" />
          <div className="skeleton-body">
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProductGrid({ initialProducts }: Props) {
  const searchParams = useSearchParams()
  const urlCategory = searchParams.get('category') || ''
  const [products, setProducts] = useState<Product[]>(initialProducts || [])
  const [category, setCategory] = useState(urlCategory)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(!initialProducts)

  const fetchProducts = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (search.trim()) params.set('search', search.trim())
    const qs = params.toString()
    fetch(`/api/products${qs ? `?${qs}` : ''}`)
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [category, search])

  useEffect(() => {
    setCategory(urlCategory)
  }, [urlCategory])

  useEffect(() => {
    // When filters are cleared and we have server-rendered products, restore them
    if (initialProducts && !category && !search) {
      setProducts(initialProducts)
      return
    }
    const timer = setTimeout(fetchProducts, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchProducts, search, category, initialProducts])

  const categories = ['All', 'Classic', 'Taro', 'Matcha', 'Brown Sugar', 'Fruity', 'Specialty', 'Seasonal']

  return (
    <>
      <div className="search-bar-wrap">
        <span className="search-icon" aria-hidden="true">🔍</span>
        <input
          type="search"
          className="search-bar"
          placeholder="Search flavors..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search products"
          enterKeyHint="search"
          autoComplete="off"
        />
      </div>

      <div className="category-filters" role="group" aria-label="Filter by category">
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${(cat === 'All' && !category) || cat === category ? 'active' : ''}`}
            onClick={() => setCategory(cat === 'All' ? '' : cat)}
            aria-pressed={(cat === 'All' && !category) || cat === category}
          >
            {cat}
          </button>
        ))}
      </div>

      {!loading && products.length > 0 && (search || category) && (
        <div className="results-count">
          {products.length} {products.length === 1 ? 'result' : 'results'}
          {category && <> in <strong>{category}</strong></>}
          {search && <> for &ldquo;{search}&rdquo;</>}
        </div>
      )}

      {loading ? (
        <SkeletonCards />
      ) : products.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">🧋</span>
          <p className="empty-state-text">No flavors match your search.</p>
          <button
            className="btn btn-secondary"
            onClick={() => { setSearch(''); setCategory('') }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  )
}
