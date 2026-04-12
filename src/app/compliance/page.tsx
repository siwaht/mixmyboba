import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Policies & Info',
  description: 'Terms of Service, Privacy Policy, shipping info, return policy, handling guide, and testing information for Immortality Peptides research-grade peptides.',
}

const sections = [
  {
    id: 'how',
    icon: '🧋',
    title: 'How to Prepare',
    content: 'Add 1-2 tablespoons of your chosen Mix My Boba flavor to a cup. Pour in 2-3oz of hot (not boiling) water and stir until the powder is fully dissolved. Add 4-6oz of your favorite milk — dairy, oat, almond, coconut, or soy all work great. Stir or froth until smooth. For iced boba, pour over a full glass of ice. For extra indulgence, add quick-cook tapioca pearls, popping boba, or jelly toppings. Adjust sweetness to your preference with honey, agave, or simple syrup.',
  },
  {
    id: 'ingredients',
    icon: '🌱',
    title: 'Our Ingredients Promise',
    content: 'Every Mix My Boba flavor is made with real, finely milled whole tea leaves — not artificial tea flavoring. We use natural sweeteners and natural flavoring only. Zero artificial colors, zero artificial preservatives, zero mystery ingredients. Our mixes are plant-based friendly (no dairy in the powder). Full ingredient lists are available on every product page. We believe in full transparency — if you have questions about any ingredient, reach out to us at hello@mixmyboba.com.',
  },
  {
    id: 'terms',
    icon: '📜',
    title: 'Terms of Service',
    content: 'By accessing mixmyboba.com and placing an order, you agree that: (1) You are at least 18 years of age or have parental consent. (2) All information you provide is accurate and complete. (3) You are responsible for maintaining the confidentiality of your account. (4) Mix My Boba reserves the right to refuse service, modify prices, or discontinue products at any time. (5) Product images are for illustration purposes and actual products may vary slightly. (6) Nutritional information is approximate and may vary by batch.',
  },
  {
    id: 'privacy',
    icon: '🔒',
    title: 'Privacy Policy',
    content: 'We collect only the information necessary to process your order: name, email, shipping address, and payment information. We do not sell, share, or distribute personal information to third parties for marketing purposes. Payment processing is handled by secure third-party processors (Stripe). All data is encrypted in transit (TLS) and at rest. You may request deletion of your account and data at any time by emailing hello@mixmyboba.com. We may use anonymized, aggregated data to improve our products and services.',
  },
  {
    id: 'returns',
    icon: '💜',
    title: 'Return & Satisfaction Policy',
    content: 'We offer a 30-day happiness guarantee on all first-time purchases. If you are not completely satisfied with your Mix My Boba order, contact us at hello@mixmyboba.com and we will make it right — whether that means a replacement, exchange, or refund. Opened products are eligible for refund within 30 days of delivery. Unopened products can be returned for a full refund within 30 days. We want you to love every sip.',
  },
  {
    id: 'shipping',
    icon: '📦',
    title: 'Shipping Information',
    content: 'Orders placed before 2pm EST Monday-Friday ship same day. Standard shipping (3-5 business days) is free on orders over $50. Expedited shipping options are available at checkout. We currently ship within the United States only — international shipping is coming soon. All orders are carefully packaged to ensure your mixes arrive fresh and intact. Tracking information is emailed as soon as your order ships.',
  },
]

export default function CompliancePage() {
  return (
    <section className="content-page">
      <div className="container" style={{ maxWidth: 780 }}>
        <div className="content-page-header">
          <h1>Policies & Info</h1>
          <p className="page-subtitle">Everything you need to know, all in one place.</p>
        </div>
        {sections.map((s, i) => (
          <div key={i} id={s.id} className="content-card glass" style={{ scrollMarginTop: '100px' }}>
            <div className="content-card-icon" aria-hidden="true">{s.icon}</div>
            <h2>{s.title}</h2>
            <p>{s.content}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
