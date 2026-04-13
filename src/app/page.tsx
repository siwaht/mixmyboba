import { Suspense } from 'react'
import Link from 'next/link'
import ProductGrid from '@/components/ProductGrid'
import { prisma } from '@/lib/db'
import { ArrowRight, Sparkles, Coffee, Leaf, Heart } from 'lucide-react'
import { getCachedJson } from '@/lib/settings-cache'

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
  const defaultMarquee2 = ['🧋 Craveable Taste', '🌸 Zero Junk', '🍵 Functional Superfoods', '💚 Gut Friendly', '⚡ Clean Energy', '🧠 Focus & Clarity', '🧘 No Crash']
  const defaultStats = [
    { value: '20+', label: 'Servings Per Bag' },
    { value: '<$2', label: 'Per Cup' },
    { value: '60s', label: 'Prep Time' },
    { value: '5★', label: 'Avg Rating' },
  ]

  const settings = await getCachedJson<Record<string, unknown>>('site-settings.json', {})
  const pc = await getCachedJson<Record<string, unknown>>('page-content.json', {})
  const hp = (pc.homepage ?? {}) as Record<string, unknown>

  const marqueeItems = (Array.isArray(settings.marqueeItems) && settings.marqueeItems.length) ? settings.marqueeItems : defaultMarquee
  const marquee2 = (Array.isArray(hp.marquee2) && hp.marquee2.length) ? hp.marquee2 as string[] : defaultMarquee2
  const statsBar = (Array.isArray(settings.statsBar) && settings.statsBar.length) ? settings.statsBar : defaultStats

  const heroBadge = (hp.heroBadge as string) || 'Free US Shipping on $50+ ✨'
  const heroTitle = (hp.heroTitle as string) || 'Sip the magic.'
  const heroHighlight = (hp.heroHighlight as string) || 'Boba, but make it easy.'
  const heroSubtitle = (hp.heroSubtitle as string) || 'Functional milk tea mixes with real tea leaves, date-sweetened, and loaded with adaptogens & vitamins. No junk, no crash, no bloat — boba shop vibes in 60 seconds flat. 🧋'
  const heroPrimaryCta = (hp.heroPrimaryCta as { text: string; href: string }) || { text: 'Shop Flavors', href: '#store' }
  const heroSecondaryCta = (hp.heroSecondaryCta as { text: string; href: string }) || { text: 'Our Story', href: '/about' }

  const defaultFeatureCards = [
    { icon: 'Coffee', title: 'Real Tea, Real Superfoods 🍵', description: "Finely milled whole tea leaves with functional adaptogens — lion's mane, ashwagandha, reishi, maca. Every sip delivers boba shop taste plus ingredients that actually support your body." },
    { icon: 'Leaf', title: 'Date-Sweetened, Zero Junk 🌿', description: 'Sweetened with organic dates — not industrial sugar, HFCS, or artificial sweeteners. No toxic non-dairy creamer, no preservatives, no cheap tea dust. Just clean ingredients you can pronounce.' },
    { icon: 'Heart', title: 'Gut Happy, No Crash 💚', description: 'Prebiotic chicory fiber in every scoop feeds your good gut bacteria. Vitamins D3, B12, C, zinc, and magnesium for daily support. Smooth energy with zero bloating and no afternoon crash.' },
  ]
  const featureCards = (Array.isArray(hp.featureCards) && hp.featureCards.length) ? hp.featureCards as typeof defaultFeatureCards : defaultFeatureCards

  const comp = (hp.comparison ?? {}) as Record<string, unknown>
  const compTitle = (comp.title as string) || 'Not Your Average Premix 🚫'
  const compSubtitle = (comp.subtitle as string) || 'Most instant boba is loaded with junk. We flipped the script.'
  const compThemLabel = (comp.themLabel as string) || 'Typical Premix'
  const compThemItems = (Array.isArray(comp.themItems) ? comp.themItems : [
    'Refined white sugar & HFCS', 'Hydrogenated non-dairy creamer', 'Artificial flavors & colors',
    'Cheap tea dust (fannings)', 'Preservatives (BHA, TBHQ)', 'Sugar crash & bloating', 'Zero nutritional value',
  ]) as string[]
  const compUsLabel = (comp.usLabel as string) || 'Mix My Boba'
  const compUsItems = (Array.isArray(comp.usItems) ? comp.usItems : [
    'Organic date powder sweetener', 'Coconut cream & oat milk powder', 'Real fruit & natural extracts',
    'Whole-leaf finely milled tea', 'Adaptogens & functional mushrooms', 'Prebiotic fiber for gut health', 'Vitamins D3, B12, C, zinc & more',
  ]) as string[]

  const store = (hp.storeSection ?? {}) as Record<string, unknown>
  const storeTitle = (store.title as string) || 'Find Your Flavor'
  const storeSubtitle = (store.subtitle as string) || 'Classic milk tea, taro, matcha, brown sugar, and more — each with its own functional superpower. Date-sweetened, adaptogen-infused, gut-friendly.'

  const proc = (hp.processSection ?? {}) as Record<string, unknown>
  const procTitle = (proc.title as string) || '60 Seconds to Boba Bliss ✨'
  const procSubtitle = (proc.subtitle as string) || 'No boba shop needed. No blender. No mess. Just good vibes.'
  const defaultSteps = [
    { num: '01', title: 'Scoop', description: "Grab 1-2 tablespoons of your fave flavor. That's it. You're already halfway there." },
    { num: '02', title: 'Mix', description: "Pour hot water + your milk of choice. Stir or froth until it's smooth and dreamy." },
    { num: '03', title: 'Customize', description: 'Adjust sweetness, add ice, throw in tapioca pearls. Make it 100% you.' },
    { num: '04', title: 'Sip & Vibe', description: 'Boba shop quality from your kitchen. Every. Single. Day. You deserve this.' },
  ]
  const procSteps = (Array.isArray(proc.steps) && proc.steps.length) ? proc.steps as typeof defaultSteps : defaultSteps

  const vibe = (hp.vibeSection ?? {}) as Record<string, unknown>
  const vibeTitle = (vibe.title as string) || 'Why People Are Obsessed 🧋'
  const vibeSubtitle = (vibe.subtitle as string) || "Boba that tastes incredible AND supports your body? That's the whole point."
  const defaultVibeCards = [
    { emoji: '🌿', stat: '0g', title: 'Zero Refined Sugar', description: 'Sweetened with organic dates — not industrial sugar, HFCS, or artificial sweeteners. Real sweetness with fiber, iron, and potassium built in. No blood sugar rollercoaster.' },
    { emoji: '💚', stat: '4g+', title: 'Prebiotic Fiber', description: 'Every scoop has chicory root fiber that feeds your good gut bacteria. No bloating, no discomfort — just smooth digestion and a happy microbiome.' },
    { emoji: '🧠', stat: '5+', title: 'Functional Adaptogens', description: "Lion's mane for focus, ashwagandha for calm, reishi for immunity, maca for energy, tulsi for stress. Each flavor has its own functional superpower." },
  ]
  const vibeCards = (Array.isArray(vibe.cards) && vibe.cards.length) ? vibe.cards as typeof defaultVibeCards : defaultVibeCards

  const cta = (hp.ctaSection ?? {}) as Record<string, unknown>
  const ctaTitle = (cta.title as string) || 'Need Bulk or Custom Orders? 📦'
  const ctaDesc = (cta.description as string) || "Looking for custom flavors or large-quantity orders? We offer flexible bulk options for businesses, events, and gifting. Let's chat!"
  const ctaPrimary = (cta.primaryCta as { text: string; href: string }) || { text: 'Get in Touch', href: '/faq' }
  const ctaSecondary = (cta.secondaryCta as { text: string; href: string }) || { text: 'Browse Products', href: '/#store' }

  const iconMap: Record<string, typeof Coffee> = { Coffee, Leaf, Heart }

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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Mix My Boba',
    description: heroSubtitle,
    url: 'https://mixmyboba.com',
    sameAs: [],
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Boba Tea Mixes' },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Hero ── */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-line" aria-hidden="true" />
        <div className="hero-accent-ring" aria-hidden="true" />
        <div className="container">
          <div className="hero-badge">
            <span className="hero-badge-dot" aria-hidden="true" />
            {heroBadge}
          </div>
          <h1 id="hero-heading">
            {heroTitle}<br className="hero-br" />
            <span className="hero-highlight">{heroHighlight}</span>
          </h1>
          <p>{heroSubtitle}</p>
          <div className="hero-ctas">
            <Link href={heroPrimaryCta.href} className="btn btn-primary">
              {heroPrimaryCta.text}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href={heroSecondaryCta.href} className="btn btn-secondary">{heroSecondaryCta.text}</Link>
          </div>
          <div className="hero-scroll-hint" aria-hidden="true">
            <span className="hero-scroll-line" />
          </div>
        </div>
      </section>

      {/* ── Dual Marquee ── */}
      <div className="trust-marquee" aria-hidden="true">
        <div className="trust-marquee-track">
          {[...marqueeItems, ...marqueeItems].flatMap((item: string, i: number) => [
            <span key={`item-${i}`}>{(i === 0 || i === marqueeItems.length) && <Sparkles size={12} />} {item}</span>,
            <span key={`dot-${i}`} style={{ opacity: 0.3 }}>✦</span>,
          ])}
        </div>
      </div>
      <div className="trust-marquee-reverse" aria-hidden="true">
        <div className="trust-marquee-track">
          {[...marquee2, ...marquee2].flatMap((item: string, i: number) => [
            <span key={`r-item-${i}`}>{item}</span>,
            <span key={`r-dot-${i}`} style={{ opacity: 0.3 }}>✦</span>,
          ])}
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="stats-bar" role="list" aria-label="Key highlights">
        <div className="stats-bar-inner">
          {statsBar.map((stat: { value: string; label: string }, i: number) => (
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
            {featureCards.map((card, i) => {
              const Icon = iconMap[card.icon] || Coffee
              return (
                <article className="feature-card" key={i}>
                  <Icon className="feature-icon" strokeWidth={1.5} aria-hidden="true" />
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="comparison-section" aria-labelledby="comparison-heading">
        <div className="container">
          <h2 id="comparison-heading">{compTitle}</h2>
          <p className="comparison-subtitle">{compSubtitle}</p>
          <div className="comparison-grid">
            <div className="comparison-col comparison-them">
              <h3>{compThemLabel}</h3>
              <ul>
                {compThemItems.map((item, i) => (
                  <li key={i}><span className="comparison-x" aria-hidden="true">✕</span> {item}</li>
                ))}
              </ul>
            </div>
            <div className="comparison-col comparison-us">
              <h3>{compUsLabel}</h3>
              <ul>
                {compUsItems.map((item, i) => (
                  <li key={i}><span className="comparison-check" aria-hidden="true">✓</span> {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Shop Flavors ── */}
      <section id="store" className="store-section" aria-labelledby="store-heading">
        <div className="container">
          <div className="section-head">
            <h2 id="store-heading">{storeTitle}</h2>
            <p>{storeSubtitle}</p>
          </div>
          <Suspense>
            <ProductGrid initialProducts={initialProducts} />
          </Suspense>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="process-section" aria-labelledby="process-heading">
        <div className="container">
          <h2 className="process-title" id="process-heading">{procTitle}</h2>
          <p className="process-subtitle">{procSubtitle}</p>
          <div className="process-steps">
            {procSteps.map((step, i) => (
              <article className="process-step" key={i}>
                <span className="process-step-num" aria-hidden="true">{step.num}</span>
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vibe Section ── */}
      <section className="vibe-section" aria-labelledby="vibe-heading">
        <div className="container">
          <div className="vibe-header">
            <h2 id="vibe-heading">{vibeTitle}</h2>
            <p>{vibeSubtitle}</p>
          </div>
          <div className="vibe-grid">
            {vibeCards.map((card, i) => (
              <div className="vibe-card" key={i}>
                <span className="vibe-emoji" aria-hidden="true">{card.emoji}</span>
                <span className="vibe-stat">{card.stat}</span>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section" aria-labelledby="cta-heading">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2 id="cta-heading">{ctaTitle}</h2>
              <p>{ctaDesc}</p>
            </div>
            <div className="cta-actions">
              <Link href={ctaPrimary.href} className="btn btn-primary">{ctaPrimary.text} <ArrowRight size={16} aria-hidden="true" /></Link>
              <Link href={ctaSecondary.href} className="btn btn-secondary">{ctaSecondary.text}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
