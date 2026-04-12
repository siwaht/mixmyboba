import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import AddToCartButton from './AddToCartButton'
import ReviewSection from './ReviewSection'
import ProductSocialProof from './ProductSocialProof'
import { getCachedJson } from '@/lib/settings-cache'

type TagDef = { slug: string; label: string; emoji: string; color: string }

async function getTagDefs(): Promise<TagDef[]> {
  return getCachedJson<TagDef[]>('product-tags.json', [])
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findUnique({ where: { slug } })
  if (!product) return {}

  return {
    title: `${product.name} — Premium Boba Tea Mix`,
    description: `${product.name} premium boba tea mix — ${product.purity}. ${product.description.slice(0, 140)}. Made with real tea. Ships fast.`,
    openGraph: {
      title: `${product.name} | Mix My Boba`,
      description: product.description,
      images: [{ url: product.imageUrl, width: 600, height: 600, alt: product.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} — Premium Mix`,
      description: product.description.slice(0, 200),
      images: [product.imageUrl],
    },
    alternates: {
      canonical: `${process.env.SITE_URL || 'https://mixmyboba.com'}/product/${slug}`,
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      variants: { where: { active: true }, orderBy: { price: 'asc' } },
      coas: { orderBy: { testDate: 'desc' }, take: 5 },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })
  if (!product) notFound()

  const avgRating = product.reviews.length
    ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
    : null

  const tagDefs = product.tag ? await getTagDefs() : []
  const tagInfo = product.tag ? tagDefs.find(t => t.slug === product.tag) : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.imageUrl,
    ...(avgRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating.toFixed(1),
        reviewCount: product.reviews.length,
      },
    }),
    offers: product.variants.length > 0
      ? product.variants.map(v => ({
          '@type': 'Offer',
          price: v.price,
          priceCurrency: 'USD',
          name: v.label,
          availability: v.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        }))
      : {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'USD',
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
  }

  return (
    <section className="product-detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/#store">Shop</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)' }}>{product.name}</span>
        </nav>

        <div className="product-detail-grid">
          <div className="product-detail-img">
            <Image src={product.imageUrl} alt={product.name} width={600} height={600} priority style={{ width: '100%', height: 'auto' }} />
          </div>
          <div className="product-detail-info">
            <span className="product-category-badge">{product.category}</span>
            {tagInfo && (
                <span
                  className="product-tag-detail"
                  style={{
                    background: `linear-gradient(135deg, ${tagInfo.color}e6, ${tagInfo.color}cc)`,
                    color: '#fff',
                    border: `1px solid ${tagInfo.color}66`,
                    boxShadow: `0 2px 8px ${tagInfo.color}33`,
                  }}
                >
                  {tagInfo.emoji} {tagInfo.label}
                </span>
            )}
            <h1>{product.name}</h1>

            {avgRating && (
              <div className="product-rating-summary">
                <span className="stars" aria-label={`${avgRating.toFixed(1)} out of 5 stars`}>
                  {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                </span>
                <span className="rating-text">{avgRating.toFixed(1)} ({product.reviews.length} review{product.reviews.length !== 1 ? 's' : ''})</span>
              </div>
            )}

            <div className="product-detail-price">
              {product.variants.length > 1
                ? `From $${product.variants[0].price.toFixed(2)}`
                : `$${product.price.toFixed(2)}`}
            </div>
            <p className="product-detail-desc">{product.description}</p>

            <div className="product-specs">
              <div className="spec-row">
                <span>Servings</span>
                <span className="spec-value">{product.purity}</span>
              </div>
              <div className="spec-row">
                <span>Format</span>
                <span className="spec-value">{product.form}</span>
              </div>
              <div className="spec-row">
                <span>Storage</span>
                <span className="spec-value">Cool & Dry Place</span>
              </div>
              <div className="spec-row">
                <span>Dietary</span>
                <span className="spec-value">Plant-Based Friendly · Gluten-Free</span>
              </div>
              <div className="spec-row">
                <span>Ingredients</span>
                <span className="spec-value">Real Tea · Natural Sweeteners · No Artificial Colors</span>
              </div>
              <div className="spec-row">
                <span>Availability</span>
                <span className="spec-value" style={{ color: product.stock > 0 ? 'var(--success)' : 'var(--error)' }}>
                  {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>

            <AddToCartButton
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
              }}
              variants={product.variants.map(v => ({
                id: v.id,
                label: v.label,
                price: v.price,
                stock: v.stock,
              }))}
              disabled={product.stock <= 0}
            />

            <ProductSocialProof productId={product.id} productSlug={product.slug} stock={product.stock} productName={product.name} />

            <div className="prep-tip-notice">
              <p>🧋 Preparation Tip</p>
              <p>For best results, use hot (not boiling) water and froth with your favorite milk. Works great iced too — just pour over ice after mixing. Customize sweetness to your taste.</p>
            </div>
          </div>
        </div>

        {/* Preparation & Info */}
        <div className="pdp-info-grid">
          <div className="pdp-info-card">
            <h3>🧊 Serving Suggestions</h3>
            <p>Works hot or iced with any milk — dairy, oat, almond, coconut, or soy. Add tapioca pearls, popping boba, or jelly for the full boba shop experience. Adjust sweetness to your preference.</p>
          </div>
          <div className="pdp-info-card">
            <h3>📊 Quality Promise</h3>
            <p>Made with real tea leaves and natural ingredients. No artificial colors, flavors, or preservatives. Every batch is tested for quality and consistency before packaging.</p>
          </div>
          <div className="pdp-info-card">
            <h3>📦 Shipping</h3>
            <p>Orders placed before 2pm EST ship same day. Standard delivery takes 3-5 business days. Free shipping on orders over $50. Packaged with care to ensure freshness.</p>
          </div>
        </div>

        {/* Reviews Section */}
        <ReviewSection
          productId={product.id}
          reviews={product.reviews.map(r => ({
            id: r.id,
            rating: r.rating,
            title: r.title,
            body: r.body,
            verified: r.verified,
            userName: r.user.name || 'Anonymous',
            createdAt: r.createdAt.toISOString(),
          }))}
          avgRating={avgRating}
          reviewCount={product.reviews.length}
        />
      </div>
    </section>
  )
}
