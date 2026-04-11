import { Suspense } from 'react'
import Link from 'next/link'
import ProductGrid from '@/components/ProductGrid'
import { prisma } from '@/lib/db'
import { ArrowRight, Sparkles, Coffee, Leaf, Heart } from 'lucide-react'
import { getCachedJson } from '@/lib/settings-cache'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'Mix My Boba',
  description: 'Premium instant boba tea mixes made with real tea and natural ingredients. Classic milk tea, taro, matcha, brown sugar — just add water and your favorite milk. Ready in 60 seconds.',
  url: 'https://mixmyboba.com',
  sameAs: [],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Boba Tea Mixes',
    itemListElement: [
      { '@type': 'OfferCatalog', name: 'Classic Milk Tea' },
      { '@type': 'OfferCatalog', name: 'Taro' },
      { '@type': 'OfferCatalog', name: 'Matcha' },
      { '@type': 'OfferCatalog', name: 'Brown Sugar' },
      { '@type': 'OfferCatalog', name: 'Fruity' },
    ],
  },
}

export default async function Home() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      variants: { where: { active: true }, orderBy: { price: 'asc' } },
      reviews: { select: { rating: true } },
    },
  })

  const defaultMarquee = ['Real Tea Leaves', 'No Artificial Flavors', 'Ready in 60 Seconds', 'Naturally Sweetened', 'Boba Shop Taste', 'Plant-Based Friendly', 'Under $2 a Cup']
  const defaultStats = [
    { value: '20+', label: 'Servings Per Bag' },
    { value: '<$2', label: 'Per Cup' },
    { value: '60s', label: 'Prep Time' },
    { value: '5★', label: 'Avg Rating' },
  ]
  const settings = await getCachedJson<{ marqueeItems?: string[]; statsBar?: { value: string; label: string }[] }>(
    'site-settings.json',
    {}
  )
  const marqueeItems = (Array.isArray(settings.marqueeItems) && settings.marqueeItems.length) ? settings.marqueeItems : defaultMarquee
  const statsBar = (Array.isArray(settings.statsBar) && settings.statsBar.length) ? settings.statsBar : defaultStats

  const initialProducts = products.map(p => ({
    ...p,
    avgRating: p.reviews.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : null,
    reviewCount: p.reviews.length,
    startingPrice: p.variants.length ? p.variants[0].price : p.price,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    variants: p.variants.map(v => ({ ...v })),
    reviews: p.reviews,
  }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-line" aria-hidden="true" />
        <div className="hero-accent-ring" aria-hidden="true" />
        <div className="container">
          <div className="hero-badge">
            <span className="hero-badge-dot" aria-hidden="true" />
            Now Shipping Nationwide
          </div>
          <h1 id="hero-heading">
            Boba shop taste,<br className="hero-br" /> made at home.
          </h1>
          <p>
            Premium instant boba tea mixes crafted with real tea leaves and natural ingredients.
            Just add water and your favorite milk — your perfect cup, ready in 60 seconds.
          </p>
          <div className="hero-ctas">
            <Link href="#store" className="btn btn-primary">
              Shop Flavors
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/about" className="btn btn-secondary">Our Story</Link>
          </div>
          <div className="hero-scroll-hint" aria-hidden="true">
            <span className="hero-scroll-line" />
          </div>
        </div>
      </section>

      <div className="trust-marquee" aria-hidden="true">
        <div className="trust-marquee-track">
          {[...marqueeItems, ...marqueeItems].flatMap((item, i) => [
            <span key={`item-${i}`}>{(i === 0 || i === marqueeItems.length) && <Sparkles size={12} />} {item}</span>,
            <span key={`dot-${i}`}>·</span>,
          ])}
        </div>
      </div>

      <div className="stats-bar" role="list" aria-label="Key highlights">
        <div className="stats-bar-inner">
          {statsBar.map((stat, i) => (
            <div className="stat-item" role="listitem" key={i}>
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="features-section" aria-labelledby="features-heading">
        <div className="container">
          <h2 id="features-heading" className="sr-only">Why Mix My Boba</h2>
          <div className="features-grid">
            <article className="feature-card">
              <Coffee className="feature-icon" strokeWidth={1.5} aria-hidden="true" />
              <h3>Real Tea, Real Flavor</h3>
              <p>We use finely milled whole tea leaves — not artificial tea flavoring. Every sip delivers authentic boba shop taste with full-bodied depth.</p>
            </article>
            <article className="feature-card">
              <Leaf className="feature-icon" strokeWidth={1.5} aria-hidden="true" />
              <h3>Clean Ingredients</h3>
              <p>Naturally sweetened, zero artificial colors or preservatives. Plant-based friendly options available. Feel good about every cup.</p>
            </article>
            <article className="feature-card">
              <Heart className="feature-icon" strokeWidth={1.5} aria-hidden="true" />
              <h3>Your Way, Every Day</h3>
              <p>Hot or iced. Any milk. Any sweetness level. Scoop, mix, done — no blender, no brewing, no cleanup. Your daily boba ritual, simplified.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="store" className="store-section" aria-labelledby="store-heading">
        <div className="container">
          <div className="section-head">
            <h2 id="store-heading">Find Your Flavor</h2>
            <p>Classic milk tea, taro, matcha, brown sugar, and more — crafted with real ingredients for boba lovers everywhere.</p>
          </div>
          <Suspense>
            <ProductGrid initialProducts={initialProducts} />
          </Suspense>
        </div>
      </section>

      <section className="process-section" aria-labelledby="process-heading">
        <div className="container">
          <h2 className="process-title" id="process-heading">How It Works</h2>
          <div className="process-steps">
            <article className="process-step">
              <span className="process-step-num" aria-hidden="true">01</span>
              <h4>Scoop</h4>
              <p>Add 1-2 tablespoons of your favorite Mix My Boba flavor to a cup.</p>
            </article>
            <article className="process-step">
              <span className="process-step-num" aria-hidden="true">02</span>
              <h4>Mix</h4>
              <p>Pour in hot water and your milk of choice. Stir or froth until smooth.</p>
            </article>
            <article className="process-step">
              <span className="process-step-num" aria-hidden="true">03</span>
              <h4>Customize</h4>
              <p>Adjust sweetness, add ice, or top with tapioca pearls. Make it yours.</p>
            </article>
            <article className="process-step">
              <span className="process-step-num" aria-hidden="true">04</span>
              <h4>Enjoy</h4>
              <p>Sip and savor boba shop quality from the comfort of home. Every single day.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="cta-section" aria-labelledby="cta-heading">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2 id="cta-heading">Can&apos;t Decide? Try the Sampler.</h2>
              <p>Get a taste of every flavor with our curated sampler pack. Perfect for finding your new daily ritual — or gifting to a boba-loving friend.</p>
            </div>
            <div className="cta-actions">
              <Link href="/#store" className="btn btn-primary">Shop Now <ArrowRight size={16} aria-hidden="true" /></Link>
              <Link href="/faq" className="btn btn-secondary">Read FAQ</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
