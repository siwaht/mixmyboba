import { Suspense } from 'react'
import Link from 'next/link'
import ProductGrid from '@/components/ProductGrid'
import { prisma } from '@/lib/db'
import { ArrowRight, Sparkles, Coffee, Leaf, Heart, Zap, Star } from 'lucide-react'
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
  const marquee2 = ['🧋 Craveable Taste', '🌸 Zero Guilt', '🍵 Authentic Flavor', '💜 Gut Friendly', '⚡ Clean Energy', '🌿 Balanced Mood']
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

      {/* ── Hero ── */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-line" aria-hidden="true" />
        <div className="hero-accent-ring" aria-hidden="true" />
        <div className="container">
          <div className="hero-badge">
            <span className="hero-badge-dot" aria-hidden="true" />
            Now Shipping Nationwide ✨
          </div>
          <h1 id="hero-heading">
            Sip the magic.<br className="hero-br" />
            <span className="hero-highlight">Boba, but make it easy.</span>
          </h1>
          <p>
            Superfood milk tea mixes made with real tea leaves and zero artificial anything.
            Just scoop, pour, sip — boba shop vibes in 60 seconds flat. 🧋
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

      {/* ── Dual Marquee (Superboba-inspired) ── */}
      <div className="trust-marquee" aria-hidden="true">
        <div className="trust-marquee-track">
          {[...marqueeItems, ...marqueeItems].flatMap((item, i) => [
            <span key={`item-${i}`}>{(i === 0 || i === marqueeItems.length) && <Sparkles size={12} />} {item}</span>,
            <span key={`dot-${i}`} style={{ opacity: 0.3 }}>✦</span>,
          ])}
        </div>
      </div>
      <div className="trust-marquee-reverse" aria-hidden="true">
        <div className="trust-marquee-track">
          {[...marquee2, ...marquee2].flatMap((item, i) => [
            <span key={`r-item-${i}`}>{item}</span>,
            <span key={`r-dot-${i}`} style={{ opacity: 0.3 }}>✦</span>,
          ])}
        </div>
      </div>

      {/* ── Stats Bar ── */}
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

      {/* ── Why Section ── */}
      <section className="features-section" aria-labelledby="features-heading">
        <div className="container">
          <h2 id="features-heading" className="sr-only">Why Mix My Boba</h2>
          <div className="features-grid">
            <article className="feature-card">
              <Coffee className="feature-icon" strokeWidth={1.5} aria-hidden="true" />
              <h3>Real Tea, Real Flavor 🍵</h3>
              <p>Finely milled whole tea leaves — not artificial tea flavoring. Every sip delivers authentic boba shop taste with full-bodied depth you can feel.</p>
            </article>
            <article className="feature-card">
              <Leaf className="feature-icon" strokeWidth={1.5} aria-hidden="true" />
              <h3>Clean &amp; Kawaii 🌿</h3>
              <p>Naturally sweetened, zero artificial colors or preservatives. Plant-based friendly. Feel good about every cup — your body will thank you.</p>
            </article>
            <article className="feature-card">
              <Heart className="feature-icon" strokeWidth={1.5} aria-hidden="true" />
              <h3>Your Way, Every Day 💖</h3>
              <p>Hot or iced. Any milk. Any sweetness. Scoop, mix, done — no blender, no brewing, no cleanup. Your daily ritual, simplified.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Shop Flavors ── */}
      <section id="store" className="store-section" aria-labelledby="store-heading">
        <div className="container">
          <div className="section-head">
            <h2 id="store-heading">Find Your Flavor</h2>
            <p>Classic milk tea, taro, matcha, brown sugar, and more — crafted with love for boba lovers everywhere.</p>
          </div>
          <Suspense>
            <ProductGrid initialProducts={initialProducts} />
          </Suspense>
        </div>
      </section>

      {/* ── How It Works (BOBABAM-inspired playful steps) ── */}
      <section className="process-section" aria-labelledby="process-heading">
        <div className="container">
          <h2 className="process-title" id="process-heading">60 Seconds to Boba Bliss ✨</h2>
          <p className="process-subtitle">No boba shop needed. No blender. No mess. Just good vibes.</p>
          <div className="process-steps">
            <article className="process-step">
              <span className="process-step-num" aria-hidden="true">01</span>
              <h4>Scoop</h4>
              <p>Grab 1-2 tablespoons of your fave flavor. That&apos;s it. You&apos;re already halfway there.</p>
            </article>
            <article className="process-step">
              <span className="process-step-num" aria-hidden="true">02</span>
              <h4>Mix</h4>
              <p>Pour hot water + your milk of choice. Stir or froth until it&apos;s smooth and dreamy.</p>
            </article>
            <article className="process-step">
              <span className="process-step-num" aria-hidden="true">03</span>
              <h4>Customize</h4>
              <p>Adjust sweetness, add ice, throw in tapioca pearls. Make it 100% you.</p>
            </article>
            <article className="process-step">
              <span className="process-step-num" aria-hidden="true">04</span>
              <h4>Sip &amp; Vibe</h4>
              <p>Boba shop quality from your kitchen. Every. Single. Day. You deserve this.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Social Proof / Vibe Section ── */}
      <section className="vibe-section" aria-labelledby="vibe-heading">
        <div className="container">
          <div className="vibe-header">
            <h2 id="vibe-heading">Why People Are Obsessed 🧋</h2>
            <p>Join thousands who ditched the $8 boba run for something way better.</p>
          </div>
          <div className="vibe-grid">
            <div className="vibe-card">
              <span className="vibe-emoji" aria-hidden="true">💰</span>
              <span className="vibe-stat">$2/cup</span>
              <h3>Save Serious Cash</h3>
              <p>Why spend $8-10 at a boba shop when you can make the same thing at home for under two bucks? Your wallet will literally thank you.</p>
            </div>
            <div className="vibe-card">
              <span className="vibe-emoji" aria-hidden="true">⚡</span>
              <span className="vibe-stat">60 sec</span>
              <h3>Faster Than Fast</h3>
              <p>No waiting in line. No driving. No 15-minute prep. Scoop, mix, done. Your morning boba ritual just got a serious upgrade.</p>
            </div>
            <div className="vibe-card">
              <span className="vibe-emoji" aria-hidden="true">🌸</span>
              <span className="vibe-stat">100%</span>
              <h3>Clean &amp; Natural</h3>
              <p>Real tea leaves, natural sweeteners, zero artificial anything. Every ingredient you can actually pronounce. That&apos;s the vibe.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section" aria-labelledby="cta-heading">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2 id="cta-heading">Can&apos;t Decide? Try the Sampler 🎁</h2>
              <p>Get a taste of every flavor with our curated sampler pack. Perfect for finding your new daily ritual — or gifting to a boba-loving bestie.</p>
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
