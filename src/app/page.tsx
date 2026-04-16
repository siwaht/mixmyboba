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

  const defaultMarquee = ['Whole-Leaf Tea', 'Date-Sweetened', 'Adaptogen Stacks', 'Prebiotic Fiber', 'Vitamin-Fortified', 'No Artificial Anything', 'Plant-Based Creamer']
  const defaultMarquee2 = ['🍵 Whole-Leaf Tea', '🌿 Plant-Powered', '🧬 Adaptogen-Loaded', '🫶 Prebiotic Fiber', '⚡ Sustained Focus', '🍯 Date-Sweetened', '🧪 Vitamin-Fortified']
  const defaultStats = [
    { value: '20+', label: 'Cups Per Bag' },
    { value: '~$1.50', label: 'Per Cup' },
    { value: '<60s', label: 'Prep Time' },
    { value: '4.8★', label: 'Avg Rating' },
  ]

  const settings = await getCachedJson<Record<string, unknown>>('site-settings.json', {})
  const pc = await getCachedJson<Record<string, unknown>>('page-content.json', {})
  const hp = (pc.homepage ?? {}) as Record<string, unknown>

  const marqueeItems = (Array.isArray(settings.marqueeItems) && settings.marqueeItems.length) ? settings.marqueeItems : defaultMarquee
  const marquee2 = (Array.isArray(hp.marquee2) && hp.marquee2.length) ? hp.marquee2 as string[] : defaultMarquee2
  const statsBar = (Array.isArray(settings.statsBar) && settings.statsBar.length) ? settings.statsBar : defaultStats

  const heroBadge = (hp.heroBadge as string) || 'Now Shipping Nationwide 🚀'
  const heroTitle = (hp.heroTitle as string) || 'Your kitchen is the new boba shop.'
  const heroHighlight = (hp.heroHighlight as string) || 'Premium mixes. Zero compromise.'
  const heroSubtitle = (hp.heroSubtitle as string) || 'Craft-quality boba tea mixes built from whole-leaf tea, plant-based creamers, and ingredients that actually do something — adaptogens, prebiotics, and real vitamins. No fillers, no fake stuff. Just tear, stir, sip. 🧋'
  const heroPrimaryCta = (hp.heroPrimaryCta as { text: string; href: string }) || { text: 'Explore Flavors', href: '#store' }
  const heroSecondaryCta = (hp.heroSecondaryCta as { text: string; href: string }) || { text: 'How We\'re Different', href: '/about' }

  const defaultFeatureCards = [
    { icon: 'Coffee', title: 'Whole-Leaf Tea, Not Dust 🍵', description: "We start with premium whole tea leaves, stone-milled to preserve flavor and antioxidants. Then we add targeted adaptogens — ashwagandha, lion's mane, reishi, maca — matched to each flavor's purpose. This isn't flavored powder. It's real tea with real function." },
    { icon: 'Leaf', title: 'Sweetened by Dates, Not Labs 🌿', description: 'Every bag is sweetened with organic Medjool date powder — a whole food that brings natural caramel sweetness plus fiber, potassium, and iron. No sucralose, no stevia, no high-fructose corn syrup. You taste the difference immediately.' },
    { icon: 'Heart', title: 'Built for Your Gut 💚', description: 'Each scoop packs chicory root prebiotic fiber to nourish your microbiome, plus D3, B12, vitamin C, zinc, and magnesium. Smooth energy that lasts — no spike, no crash, no bloat. Nutrition that works quietly in the background.' },
  ]
  const featureCards = (Array.isArray(hp.featureCards) && hp.featureCards.length) ? hp.featureCards as typeof defaultFeatureCards : defaultFeatureCards

  const comp = (hp.comparison ?? {}) as Record<string, unknown>
  const compTitle = (comp.title as string) || 'Read the Label. Ours Wins. 🔍'
  const compSubtitle = (comp.subtitle as string) || "Most instant boba is candy in disguise. Here's what separates us."
  const compThemLabel = (comp.themLabel as string) || 'Generic Instant Boba'
  const compThemItems = (Array.isArray(comp.themItems) ? comp.themItems : [
    'High-fructose corn syrup & white sugar', 'Hydrogenated vegetable oil creamer', 'Synthetic flavors & FD&C dyes',
    'Tea fannings (leftover dust)', 'BHA, TBHQ & sodium benzoate', 'Blood sugar spike → crash cycle', 'Empty calories, zero nutrition',
  ]) as string[]
  const compUsLabel = (comp.usLabel as string) || 'Mix My Boba'
  const compUsItems = (Array.isArray(comp.usItems) ? comp.usItems : [
    'Organic Medjool date powder', 'Coconut cream & oat milk base', 'Real fruit powders & botanical extracts',
    'Stone-milled whole-leaf tea', 'Targeted adaptogens per flavor', 'Chicory root prebiotic fiber', 'D3, B12, C, zinc, magnesium in every scoop',
  ]) as string[]

  const store = (hp.storeSection ?? {}) as Record<string, unknown>
  const storeTitle = (store.title as string) || 'Pick Your Flavor'
  const storeSubtitle = (store.subtitle as string) || 'Eight flavors, each with its own adaptogen stack and purpose. Taro for calm, matcha for focus, brown sugar for energy — all date-sweetened and gut-friendly.'

  const proc = (hp.processSection ?? {}) as Record<string, unknown>
  const procTitle = (proc.title as string) || 'From Bag to Boba in Under a Minute ⏱️'
  const procSubtitle = (proc.subtitle as string) || 'No equipment. No barista skills. No cleanup drama.'
  const defaultSteps = [
    { num: '01', title: 'Measure', description: "One to two tablespoons into your favorite mug or tumbler. Each bag gives you 20+ servings." },
    { num: '02', title: 'Pour & Stir', description: "Add hot water first to dissolve, then your milk of choice — oat, almond, dairy, whatever you're into." },
    { num: '03', title: 'Make It Yours', description: 'Go hot or pour over ice. Add tapioca pearls, jelly, or extra sweetener. Your call, every time.' },
    { num: '04', title: 'Enjoy Daily', description: 'At under $2 a cup, this replaces the $8 boba run without sacrificing taste or quality.' },
  ]
  const procSteps = (Array.isArray(proc.steps) && proc.steps.length) ? proc.steps as typeof defaultSteps : defaultSteps

  const vibe = (hp.vibeSection ?? {}) as Record<string, unknown>
  const vibeTitle = (vibe.title as string) || 'The Numbers Behind Every Scoop 📊'
  const vibeSubtitle = (vibe.subtitle as string) || "We formulated these mixes with a nutritionist. Here's what's actually inside."
  const defaultVibeCards = [
    { emoji: '🍯', stat: '0g', title: 'Added Refined Sugar', description: 'Sweetened exclusively with organic date powder — a whole food with natural fiber, iron, and potassium. No blood sugar rollercoaster, no artificial sweetener aftertaste.' },
    { emoji: '🦠', stat: '4g+', title: 'Prebiotic Fiber Per Scoop', description: 'Chicory root inulin feeds beneficial gut bacteria and supports smooth digestion. Most people notice less bloating within the first week of daily use.' },
    { emoji: '🧬', stat: '5+', title: 'Adaptogens Per Flavor', description: "Each flavor has a purpose-built stack: ashwagandha for stress, lion's mane for cognition, reishi for immune support, maca for stamina, tulsi for calm. Not random — intentional." },
  ]
  const vibeCards = (Array.isArray(vibe.cards) && vibe.cards.length) ? vibe.cards as typeof defaultVibeCards : defaultVibeCards

  const cta = (hp.ctaSection ?? {}) as Record<string, unknown>
  const ctaTitle = (cta.title as string) || 'Wholesale & Custom Orders 🤝'
  const ctaDesc = (cta.description as string) || "Running a café, planning an event, or building gift boxes? We do custom flavors and bulk pricing. Reach out and we'll put something together."
  const ctaPrimary = (cta.primaryCta as { text: string; href: string }) || { text: 'Get in Touch', href: '/contact' }
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
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Craft Boba Tea Mixes' },
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
          <h2 id="features-heading" className="sr-only">What Sets Us Apart</h2>
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
