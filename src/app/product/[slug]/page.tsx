import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import AddToCartButton from './AddToCartButton'
import ReviewSection from './ReviewSection'
import ProductSocialProof from './ProductSocialProof'
import { getCachedJson } from '@/lib/settings-cache'
import { getProductIngredients } from '@/lib/product-ingredients'

type TagDef = { slug: string; label: string; emoji: string; color: string }

async function getTagDefs(): Promise<TagDef[]> {
  return getCachedJson<TagDef[]>('product-tags.json', [])
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findUnique({ where: { slug } })
  if (!product) return {}

  return {
    title: `${product.name} — Functional Boba Tea Mix`,
    description: `${product.name} functional boba tea mix — ${product.purity}. Date-sweetened, adaptogen-infused, prebiotic fiber. ${product.description.slice(0, 120)}. Ships fast.`,
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
  const ingredientData = await getProductIngredients(slug)

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
                <span className="spec-value">{ingredientData ? ingredientData.ingredients : 'Real Tea · Natural Sweeteners · No Artificial Colors'}</span>
              </div>
              {ingredientData && (
                <div className="spec-row">
                  <span>Sweetener</span>
                  <span className="spec-value">Organic Date Powder (No Refined Sugar)</span>
                </div>
              )}
              {ingredientData && (
                <div className="spec-row">
                  <span>Per Serving</span>
                  <span className="spec-value">{ingredientData.nutritionHighlights.calories} cal · {ingredientData.nutritionHighlights.sugar} sugar · {ingredientData.nutritionHighlights.fiber} fiber</span>
                </div>
              )}
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
              <p>For best results, use hot (not boiling) water to preserve the adaptogens and nutrients. Froth with your favorite milk — oat, almond, or coconut work great. Works iced too. Customize sweetness to your taste; the date powder provides a gentle natural sweetness.</p>
            </div>
          </div>
        </div>

        {/* Key Ingredients & Functional Benefits */}
        {ingredientData && (
          <>
            <div className="pdp-functional-section">
              <h2 className="pdp-functional-title">What&apos;s Inside — And Why It Matters 🧬</h2>
              <p className="pdp-functional-subtitle">Every ingredient earns its spot. No fillers, no cheap shortcuts, no industrial junk.</p>
              <div className="pdp-key-ingredients">
                {ingredientData.keyIngredients.map((ing, i) => (
                  <div key={i} className="pdp-ingredient-card">
                    <span className="pdp-ingredient-icon" aria-hidden="true">{ing.icon}</span>
                    <h4>{ing.name}</h4>
                    <p>{ing.benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pdp-benefits-section">
              <h3 className="pdp-benefits-title">Functional Benefits ✨</h3>
              <div className="pdp-benefits-grid">
                {ingredientData.functionalBenefits.map((b, i) => (
                  <div key={i} className="pdp-benefit-card">
                    <span className="pdp-benefit-icon" aria-hidden="true">{b.icon}</span>
                    <div>
                      <h4>{b.title}</h4>
                      <p>{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pdp-never-list">
              <h3>What You&apos;ll Never Find In Our Mix 🚫</h3>
              <div className="pdp-never-items">
                <span>Refined Sugar</span>
                <span>Hydrogenated Oils</span>
                <span>Artificial Flavors</span>
                <span>Preservatives</span>
                <span>Tea Dust</span>
                <span>Carrageenan</span>
                <span>HFCS</span>
                <span>Titanium Dioxide</span>
              </div>
            </div>
          </>
        )}

        {/* Preparation & Info */}
        <div className="pdp-info-grid">
          <div className="pdp-info-card">
            <h3>🧊 Serving Suggestions</h3>
            <p>Works hot or iced with any milk — dairy, oat, almond, coconut, or soy. Add tapioca pearls, popping boba, or jelly for the full boba shop experience. Adjust sweetness to your preference.</p>
          </div>
          <div className="pdp-info-card">
            <h3>📊 Quality Promise</h3>
            <p>Made with real tea leaves, date-sweetened, and loaded with functional superfoods. No artificial colors, flavors, or preservatives. Every batch is tested for quality and consistency.</p>
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
