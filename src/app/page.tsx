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
  description: 'Functional instant boba tea mixes made with real tea, date-sweetened, and loaded with adaptogens, prebiotics & vitamins. Classic milk tea, taro, matcha, brown sugar — no artificial anything. Ready in 60 seconds.',
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

  const defaultMarquee = ['Real Tea Leaves', 'Date-Sweetened', 'Adaptogen-Infused', 'Prebiotic Fiber', 'Vitamin-Fortified', 'No Artificial Anything', 'Under $2 a Cup']
  const marquee2 = ['🧋 Craveable Taste', '🌸 Zero Junk', '🍵 Functional Superfoods', '💚 Gut Friendly', '⚡ Clean Energy', '🧠 Focus & Clarity', '🧘 No Crash']
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
            Now Shipping Worldwide ✨
          </div>
          <h1 id="hero-heading">
            Sip the magic.<br className="hero-br" />
            <span className="hero-highlight">Boba, but make it easy.</span>
          </h1>
          <p>
            Functional milk tea mixes with real tea leaves, date-sweetened, and loaded with adaptogens &amp; vitamins.
            No junk, no crash, no bloat — boba shop vibes in 60 seconds flat. 🧋
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
              <h3>Real Tea, Real Superfoods 🍵</h3>
              <p>Finely milled whole tea leaves with functional adaptogens — lion&apos;s mane, ashwagandha, reishi, maca. Every sip delivers boba shop taste plus ingredients that actually support your body.</p>
            </article>
            <article className="feature-card">
              <Leaf className="feature-icon" strokeWidth={1.5} aria-hidden="true" />
              <h3>Date-Sweetened, Zero Junk 🌿</h3>
              <p>Sweetened with organic dates — not industrial sugar, HFCS, or artificial sweeteners. No toxic non-dairy creamer, no preservatives, no cheap tea dust. Just clean ingredients you can pronounce.</p>
            </article>
            <article className="feature-card">
              <Heart className="feature-icon" strokeWidth={1.5} aria-hidden="true" />
              <h3>Gut Happy, No Crash 💚</h3>
              <p>Prebiotic chicory fiber in every scoop feeds your good gut bacteria. Vitamins D3, B12, C, zinc, and magnesium for daily support. Smooth energy with zero bloating and no afternoon crash.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Not Your Average Premix — Comparison ── */}
      <section className="comparison-section" aria-labelledby="comparison-heading">
        <div className="container">
          <h2 id="comparison-heading">Not Your Average Premix 🚫</h2>
          <p className="comparison-subtitle">Most instant boba is loaded with junk. We flipped the script.</p>
          <div className="comparison-grid">
            <div className="comparison-col comparison-them">
              <h3>Typical Premix</h3>
              <ul>
                <li><span className="comparison-x" aria-hidden="true">✕</span> Refined white sugar &amp; HFCS</li>
                <li><span className="comparison-x" aria-hidden="true">✕</span> Hydrogenated non-dairy creamer</li>
                <li><span className="comparison-x" aria-hidden="true">✕</span> Artificial flavors &amp; colors</li>
                <li><span className="comparison-x" aria-hidden="true">✕</span> Cheap tea dust (fannings)</li>
                <li><span className="comparison-x" aria-hidden="true">✕</span> Preservatives (BHA, TBHQ)</li>
                <li><span className="comparison-x" aria-hidden="true">✕</span> Sugar crash &amp; bloating</li>
                <li><span className="comparison-x" aria-hidden="true">✕</span> Zero nutritional value</li>
              </ul>
            </div>
            <div className="comparison-col comparison-us">
              <h3>Mix My Boba</h3>
              <ul>
                <li><span className="comparison-check" aria-hidden="true">✓</span> Organic date powder sweetener</li>
                <li><span className="comparison-check" aria-hidden="true">✓</span> Coconut cream &amp; oat milk powder</li>
                <li><span className="comparison-check" aria-hidden="true">✓</span> Real fruit &amp; natural extracts</li>
                <li><span className="comparison-check" aria-hidden="true">✓</span> Whole-leaf finely milled tea</li>
                <li><span className="comparison-check" aria-hidden="true">✓</span> Adaptogens &amp; functional mushrooms</li>
                <li><span className="comparison-check" aria-hidden="true">✓</span> Prebiotic fiber for gut health</li>
                <li><span className="comparison-check" aria-hidden="true">✓</span> Vitamins D3, B12, C, zinc &amp; more</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Shop Flavors ── */}
      <section id="store" className="store-section" aria-labelledby="store-heading">
        <div className="container">
          <div className="section-head">
            <h2 id="store-heading">Find Your Flavor</h2>
            <p>Classic milk tea, taro, matcha, brown sugar, and more — each with its own functional superpower. Date-sweetened, adaptogen-infused, gut-friendly.</p>
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
            <p>Boba that tastes incredible AND supports your body? That&apos;s the whole point.</p>
          </div>
          <div className="vibe-grid">
            <div className="vibe-card">
              <span className="vibe-emoji" aria-hidden="true">🌿</span>
              <span className="vibe-stat">0g</span>
              <h3>Zero Refined Sugar</h3>
              <p>Sweetened with organic dates — not industrial sugar, HFCS, or artificial sweeteners. Real sweetness with fiber, iron, and potassium built in. No blood sugar rollercoaster.</p>
            </div>
            <div className="vibe-card">
              <span className="vibe-emoji" aria-hidden="true">💚</span>
              <span className="vibe-stat">4g+</span>
              <h3>Prebiotic Fiber</h3>
              <p>Every scoop has chicory root fiber that feeds your good gut bacteria. No bloating, no discomfort — just smooth digestion and a happy microbiome.</p>
            </div>
            <div className="vibe-card">
              <span className="vibe-emoji" aria-hidden="true">🧠</span>
              <span className="vibe-stat">5+</span>
              <h3>Functional Adaptogens</h3>
              <p>Lion&apos;s mane for focus, ashwagandha for calm, reishi for immunity, maca for energy, tulsi for stress. Each flavor has its own functional superpower.</p>
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
