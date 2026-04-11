'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/lib/cartStore'
import { useToast } from '@/components/Toast'

interface CompareProduct {
  id: string; slug: string; name: string; price: number; imageUrl: string
  category: string; purity: string; stock: number; molecularWeight: string | null
  sequence: string | null; casNumber: string | null; storageTemp: string; form: string
  tag: string | null; startingPrice: number; variantCount: number
  avgRating: number | null; reviewCount: number
}

export default function ComparePage() {
  const [products, setProducts] = useState<CompareProduct[]>([])
  const [allProducts, setAllProducts] = useState<{ id: string; name: string; category: string }[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const addItem = useCartStore(s => s.addItem)
  const showToast = useToast(s => s.show)

  // Load product list for selector
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then((data: CompareProduct[]) => {
      setAllProducts(data.map(p => ({ id: p.id, name: p.name, category: p.category })))
    })
  }, [])

  // Load comparison when IDs change
  useEffect(() => {
    if (selectedIds.length < 2) { setProducts([]); return }
    setLoading(true)
    fetch(`/api/compare?ids=${selectedIds.join(',')}`)
      .then(r => r.json())
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [selectedIds])

  // Check URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ids = params.get('ids')
    if (ids) setSelectedIds(ids.split(',').filter(Boolean))
  }, [])

  const toggleProduct = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    )
  }

  const specs = [
    { label: 'Category', key: 'category' },
    { label: 'Purity', key: 'purity' },
    { label: 'Form', key: 'form' },
    { label: 'Storage', key: 'storageTemp' },
    { label: 'Molecular Weight', key: 'molecularWeight' },
    { label: 'CAS Number', key: 'casNumber' },
    { label: 'Variants', key: 'variantCount' },
    { label: 'Stock', key: 'stock' },
  ] as const

  return (
    <section className="compare-section">
      <div className="container">
        <h1 style={{ marginBottom: '0.5rem' }}>Compare Products</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Select 2–4 products to compare side by side.
        </p>

        {/* Product selector */}
        <div className="compare-selector">
          {allProducts.map(p => (
            <button
              key={p.id}
              className={`compare-chip ${selectedIds.includes(p.id) ? 'active' : ''}`}
              onClick={() => toggleProduct(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner" /></div>}

        {products.length >= 2 && !loading && (
          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th></th>
                  {products.map(p => (
                    <th key={p.id}>
                      <Link href={`/product/${p.slug}`} className="compare-product-head">
                        <Image src={p.imageUrl} alt={p.name} width={80} height={80} style={{ borderRadius: 8, objectFit: 'cover' }} />
                        <span className="compare-product-name">{p.name}</span>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="compare-label">Price</td>
                  {products.map(p => (
                    <td key={p.id} className="compare-value" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                      {p.variantCount > 1 ? `From $${p.startingPrice.toFixed(2)}` : `$${p.price.toFixed(2)}`}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="compare-label">Rating</td>
                  {products.map(p => (
                    <td key={p.id} className="compare-value">
                      {p.avgRating ? (
                        <span>{'★'.repeat(Math.round(p.avgRating))}{'☆'.repeat(5 - Math.round(p.avgRating))} ({p.reviewCount})</span>
                      ) : '—'}
                    </td>
                  ))}
                </tr>
                {specs.map(spec => (
                  <tr key={spec.key}>
                    <td className="compare-label">{spec.label}</td>
                    {products.map(p => (
                      <td key={p.id} className="compare-value">
                        {String((p as unknown as Record<string, unknown>)[spec.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="compare-label"></td>
                  {products.map(p => (
                    <td key={p.id} className="compare-value">
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                        onClick={() => {
                          addItem({ productId: p.id, slug: p.slug, name: p.name, price: p.startingPrice, imageUrl: p.imageUrl })
                          showToast(`${p.name} added to cart`)
                        }}
                      >
                        Add to Cart
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {selectedIds.length < 2 && !loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Select at least 2 products above to start comparing.
          </div>
        )}
      </div>
    </section>
  )
}
