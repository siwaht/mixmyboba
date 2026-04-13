import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { safeJson, isErrorResponse } from '@/lib/safe-json'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

const CONTENT_PATH = join(process.cwd(), 'page-content.json')

export const DEFAULT_PAGE_CONTENT = {
  navbar: {
    logoEmoji: '🧋',
    logoText: 'mix my boba',
    links: [
      { label: 'Shop', href: '/#store' },
      { label: 'Our Story', href: '/about' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Compare', href: '/compare' },
    ],
  },
  homepage: {
    heroBadge: 'Now Shipping Worldwide ✨',
    heroTitle: 'Sip the magic.',
    heroHighlight: 'Boba, but make it easy.',
    heroSubtitle: 'Functional milk tea mixes with real tea leaves, date-sweetened, and loaded with adaptogens & vitamins. No junk, no crash, no bloat — boba shop vibes in 60 seconds flat. 🧋',
    heroPrimaryCta: { text: 'Shop Flavors', href: '#store' },
    heroSecondaryCta: { text: 'Our Story', href: '/about' },
    marquee2: [
      '🧋 Craveable Taste',
      '🌸 Zero Junk',
      '🍵 Functional Superfoods',
      '💚 Gut Friendly',
      '⚡ Clean Energy',
      '🧠 Focus & Clarity',
      '🧘 No Crash',
    ],
    featureCards: [
      { icon: 'Coffee', title: 'Real Tea, Real Superfoods 🍵', description: "Finely milled whole tea leaves with functional adaptogens — lion's mane, ashwagandha, reishi, maca. Every sip delivers boba shop taste plus ingredients that actually support your body." },
      { icon: 'Leaf', title: 'Date-Sweetened, Zero Junk 🌿', description: 'Sweetened with organic dates — not industrial sugar, HFCS, or artificial sweeteners. No toxic non-dairy creamer, no preservatives, no cheap tea dust. Just clean ingredients you can pronounce.' },
      { icon: 'Heart', title: 'Gut Happy, No Crash 💚', description: 'Prebiotic chicory fiber in every scoop feeds your good gut bacteria. Vitamins D3, B12, C, zinc, and magnesium for daily support. Smooth energy with zero bloating and no afternoon crash.' },
    ],
    comparison: {
      title: 'Not Your Average Premix 🚫',
      subtitle: 'Most instant boba is loaded with junk. We flipped the script.',
      themLabel: 'Typical Premix',
      themItems: [
        'Refined white sugar & HFCS',
        'Hydrogenated non-dairy creamer',
        'Artificial flavors & colors',
        'Cheap tea dust (fannings)',
        'Preservatives (BHA, TBHQ)',
        'Sugar crash & bloating',
        'Zero nutritional value',
      ],
      usLabel: 'Mix My Boba',
      usItems: [
        'Organic date powder sweetener',
        'Coconut cream & oat milk powder',
        'Real fruit & natural extracts',
        'Whole-leaf finely milled tea',
        'Adaptogens & functional mushrooms',
        'Prebiotic fiber for gut health',
        'Vitamins D3, B12, C, zinc & more',
      ],
    },
    storeSection: {
      title: 'Find Your Flavor',
      subtitle: 'Classic milk tea, taro, matcha, brown sugar, and more — each with its own functional superpower. Date-sweetened, adaptogen-infused, gut-friendly.',
    },
    processSection: {
      title: '60 Seconds to Boba Bliss ✨',
      subtitle: 'No boba shop needed. No blender. No mess. Just good vibes.',
      steps: [
        { num: '01', title: 'Scoop', description: "Grab 1-2 tablespoons of your fave flavor. That's it. You're already halfway there." },
        { num: '02', title: 'Mix', description: "Pour hot water + your milk of choice. Stir or froth until it's smooth and dreamy." },
        { num: '03', title: 'Customize', description: 'Adjust sweetness, add ice, throw in tapioca pearls. Make it 100% you.' },
        { num: '04', title: 'Sip & Vibe', description: 'Boba shop quality from your kitchen. Every. Single. Day. You deserve this.' },
      ],
    },
    vibeSection: {
      title: 'Why People Are Obsessed 🧋',
      subtitle: "Boba that tastes incredible AND supports your body? That's the whole point.",
      cards: [
        { emoji: '🌿', stat: '0g', title: 'Zero Refined Sugar', description: 'Sweetened with organic dates — not industrial sugar, HFCS, or artificial sweeteners. Real sweetness with fiber, iron, and potassium built in. No blood sugar rollercoaster.' },
        { emoji: '💚', stat: '4g+', title: 'Prebiotic Fiber', description: 'Every scoop has chicory root fiber that feeds your good gut bacteria. No bloating, no discomfort — just smooth digestion and a happy microbiome.' },
        { emoji: '🧠', stat: '5+', title: 'Functional Adaptogens', description: "Lion's mane for focus, ashwagandha for calm, reishi for immunity, maca for energy, tulsi for stress. Each flavor has its own functional superpower." },
      ],
    },
    ctaSection: {
      title: 'Need Bulk or Custom Orders? 📦',
      description: "Looking for custom flavors or large-quantity orders? We offer flexible bulk options for businesses, events, and gifting. Let's chat!",
      primaryCta: { text: 'Get in Touch', href: '/faq' },
      secondaryCta: { text: 'Browse Products', href: '/#store' },
    },
  },
  about: {
    pageTitle: 'Our Story',
    pageSubtitle: 'From boba lovers, for boba lovers.',
    sections: [
      {
        icon: '🧋',
        title: 'How It Started',
        content: 'We were spending $8-10 a day on boba runs. Every. Single. Day. We loved the ritual — the creamy milk tea, the chewy pearls, the moment of pure joy in every sip. But our wallets? Not so much. We knew there had to be a better way to get that boba shop experience without the boba shop price tag. So we set out to create it ourselves.',
      },
      {
        icon: '🍵',
        title: 'What Makes Us Different',
        content: 'Real whole tea leaves, finely milled — not artificial tea flavoring\nNaturally sweetened with no refined sugar or artificial ingredients\nEach bag has 20+ servings — that\'s less than $2 a cup\nReady in 60 seconds — scoop, mix, done\nWorks hot or iced, with any milk, at any sweetness level\nPlant-based friendly options for every flavor',
        isList: true,
      },
      {
        icon: '💜',
        title: 'Our Mission',
        content: 'We believe everyone deserves a daily boba moment — not just people who live near a boba shop or can afford $10 drinks every day. Mix My Boba is about making that joy accessible, affordable, and customizable. Your drink, your way, every single day.',
      },
      {
        icon: '🌱',
        title: 'Our Ingredients Promise',
        content: "We source premium tea leaves and use only clean, recognizable ingredients. No artificial colors, no artificial flavors, no mystery powders. Every ingredient is something you can pronounce and feel good about putting in your body. We're transparent about what goes into every bag because we drink this stuff every day too.",
      },
      {
        icon: '✉️',
        title: 'Get in Touch',
        content: 'Questions, wholesale inquiries, or just want to share your boba creations with us?',
        contactEmail: 'hello@mixmyboba.com',
        contactNote: 'We respond within 24 hours. Follow us @mixmyboba for recipes and inspo!',
      },
    ],
  },
  faq: [
    {
      category: 'Product & Preparation',
      items: [
        { q: 'How do I prepare Mix My Boba?', a: 'Add 1-2 tablespoons of your chosen flavor to a cup, pour in 6-8oz of hot water and your milk of choice (dairy, oat, almond — whatever you love), then stir or froth until smooth. Works hot or poured over ice. Ready in under 60 seconds!' },
        { q: 'What flavors are available?', a: 'We offer a growing lineup including Classic Milk Tea, Taro, Matcha, Brown Sugar, Thai Tea, Honeydew, and seasonal limited editions. Each is made with real tea leaves and natural ingredients.' },
        { q: 'How many servings are in each bag?', a: 'Each bag contains approximately 20+ servings, which works out to less than $2 per cup. Compare that to $7-10 at a boba shop!' },
        { q: 'Is it really as good as boba shop boba?', a: 'We use the same quality tea leaves and ingredients that premium boba shops use. The difference is you get to customize it exactly how you like — your milk, your sweetness, your way. Most customers say it tastes even better because they can dial it in perfectly.' },
        { q: 'Can I add tapioca pearls?', a: 'Absolutely! Our mixes pair perfectly with store-bought tapioca pearls, popping boba, or jelly toppings. We recommend quick-cook tapioca pearls for the easiest experience.' },
      ],
    },
    {
      category: 'Ingredients & Dietary',
      items: [
        { q: 'What are the ingredients?', a: 'Each flavor varies, but our core ingredients include finely milled whole tea leaves, natural sweeteners, and natural flavoring. No artificial colors, no artificial flavors, no preservatives. Full ingredient lists are on every product page.' },
        { q: 'Is Mix My Boba vegan/plant-based friendly?', a: 'Our mixes are plant-based friendly — they contain no dairy. Just use your favorite plant milk (oat, almond, coconut, soy) and you have a fully vegan boba!' },
        { q: 'Does it contain caffeine?', a: 'Most of our flavors contain natural caffeine from real tea leaves — roughly 30-50mg per serving, similar to a cup of green tea. Our caffeine-free options are clearly labeled.' },
        { q: 'Is it gluten-free?', a: 'Yes, all Mix My Boba mixes are gluten-free. However, they are produced in a facility that also processes products containing gluten.' },
      ],
    },
    {
      category: 'Shipping & Orders',
      items: [
        { q: 'How fast do you ship?', a: 'Orders placed before 2pm EST ship same day. Standard shipping takes 3-5 business days. Expedited options are available at checkout. Free shipping on orders over $50!' },
        { q: 'Do you ship internationally?', a: 'Currently we ship within the United States. International shipping is coming soon — sign up for our newsletter to be the first to know!' },
        { q: 'What is your return policy?', a: 'We offer a 30-day happiness guarantee. If you are not completely satisfied with your order, reach out to us at hello@mixmyboba.com and we will make it right — no questions asked.' },
        { q: 'Do you offer subscriptions?', a: 'Yes! Subscribe and save on every order. Choose your delivery frequency, swap flavors anytime, and cancel whenever you want. No commitment, no hassle. Subscribers save up to 20% on every order.' },
      ],
    },
  ],
  policies: [
    { id: 'how', icon: '🧋', title: 'How to Prepare', content: 'Add 1-2 tablespoons of your chosen Mix My Boba flavor to a cup. Pour in 2-3oz of hot (not boiling) water and stir until the powder is fully dissolved. Add 4-6oz of your favorite milk — dairy, oat, almond, coconut, or soy all work great. Stir or froth until smooth. For iced boba, pour over a full glass of ice. For extra indulgence, add quick-cook tapioca pearls, popping boba, or jelly toppings. Adjust sweetness to your preference with honey, agave, or simple syrup.' },
    { id: 'ingredients', icon: '🌱', title: 'Our Ingredients Promise', content: 'Every Mix My Boba flavor is made with real, finely milled whole tea leaves — not artificial tea flavoring. We use natural sweeteners and natural flavoring only. Zero artificial colors, zero artificial preservatives, zero mystery ingredients. Our mixes are plant-based friendly (no dairy in the powder). Full ingredient lists are available on every product page. We believe in full transparency — if you have questions about any ingredient, reach out to us at hello@mixmyboba.com.' },
    { id: 'terms', icon: '📜', title: 'Terms of Service', content: 'By accessing mixmyboba.com and placing an order, you agree that: (1) All information you provide is accurate and complete. (2) You are responsible for maintaining the confidentiality of your account. (3) Mix My Boba reserves the right to refuse service, modify prices, or discontinue products at any time. (4) Product images are for illustration purposes and actual products may vary slightly. (5) Nutritional information is approximate and may vary by batch.' },
    { id: 'privacy', icon: '🔒', title: 'Privacy Policy', content: 'We collect only the information necessary to process your order: name, email, shipping address, and payment information. We do not sell, share, or distribute personal information to third parties for marketing purposes. Payment processing is handled by secure third-party processors (Stripe). All data is encrypted in transit (TLS) and at rest. You may request deletion of your account and data at any time by emailing hello@mixmyboba.com. We may use anonymized, aggregated data to improve our products and services.' },
    { id: 'returns', icon: '💜', title: 'Return & Satisfaction Policy', content: 'We offer a 30-day happiness guarantee on all first-time purchases. If you are not completely satisfied with your Mix My Boba order, contact us at hello@mixmyboba.com and we will make it right — whether that means a replacement, exchange, or refund. Opened products are eligible for refund within 30 days of delivery. Unopened products can be returned for a full refund within 30 days. We want you to love every sip.' },
    { id: 'shipping', icon: '📦', title: 'Shipping Information', content: 'Orders placed before 2pm EST Monday-Friday ship same day. Standard shipping (3-5 business days) is free on orders over $50. Expedited shipping options are available at checkout. We currently ship within the United States only — international shipping is coming soon. All orders are carefully packaged to ensure your mixes arrive fresh and intact. Tracking information is emailed as soon as your order ships.' },
  ],
  footer: {
    brandDescription: 'Premium instant boba tea mixes made with real tea and natural ingredients. Your daily boba ritual, ready in 60 seconds. No boba shop needed.',
    sections: [
      {
        title: 'Flavors',
        links: [
          { label: 'Classic Milk Tea', href: '/?category=Classic#store' },
          { label: 'Matcha', href: '/?category=Matcha#store' },
          { label: 'Brown Sugar', href: '/?category=Brown+Sugar#store' },
          { label: 'Fruity', href: '/?category=Fruity#store' },
        ],
        comingSoon: 'Toppings — Coming Soon',
      },
      {
        title: 'Help',
        links: [
          { label: 'How to Prepare', href: '/compliance#how' },
          { label: 'Ingredients', href: '/compliance#ingredients' },
          { label: 'FAQ', href: '/faq' },
          { label: 'Our Story', href: '/about' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Terms of Service', href: '/compliance#terms' },
          { label: 'Privacy Policy', href: '/compliance#privacy' },
          { label: 'Return Policy', href: '/compliance#returns' },
          { label: 'Shipping Info', href: '/compliance#shipping' },
        ],
      },
    ],
  },
  seo: {
    siteTitle: 'Mix My Boba — Premium Bubble Tea Mixes | Make Boba at Home',
    siteDescription: 'Premium superfood boba tea mixes made with real tea and natural ingredients. Classic milk tea, taro, matcha, brown sugar — just add water and your favorite milk. Ready in 60 seconds.',
    siteKeywords: 'boba tea, bubble tea, milk tea mix, instant boba, boba at home, taro milk tea, matcha latte, brown sugar boba, premix boba, tea latte powder, boba kit',
  },
}

function getContent() {
  if (!existsSync(CONTENT_PATH)) {
    writeFileSync(CONTENT_PATH, JSON.stringify(DEFAULT_PAGE_CONTENT, null, 2))
    return DEFAULT_PAGE_CONTENT
  }
  try {
    const raw = JSON.parse(readFileSync(CONTENT_PATH, 'utf-8'))
    // Merge with defaults so new fields are always present
    return { ...DEFAULT_PAGE_CONTENT, ...raw }
  } catch {
    return DEFAULT_PAGE_CONTENT
  }
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  return NextResponse.json(getContent())
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  const data = await safeJson(req)
  if (isErrorResponse(data)) return data
  writeFileSync(CONTENT_PATH, JSON.stringify(data, null, 2))
  return NextResponse.json(data)
}
