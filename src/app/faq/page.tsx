import type { Metadata } from 'next'
import { getCachedJson } from '@/lib/settings-cache'

export const metadata: Metadata = {
  title: 'FAQ — Boba Tea Mixes, Preparation, Shipping & More',
  description: 'Frequently asked questions about Mix My Boba instant boba tea mixes — how to prepare, ingredients, shipping, subscriptions, and more.',
}

interface FaqCategory {
  category: string
  items: { q: string; a: string }[]
}

export default async function FAQPage() {
  const pc = await getCachedJson<Record<string, unknown>>('page-content.json', {})

  const defaultFaqs: FaqCategory[] = [
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
  ]
  const faqs = (Array.isArray(pc.faq) && pc.faq.length) ? pc.faq as FaqCategory[] : defaultFaqs

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.flatMap(section =>
      section.items.map(faq => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      }))
    ),
  }

  return (
    <section className="content-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="container" style={{ maxWidth: 780 }}>
        <div className="content-page-header">
          <h1>Frequently Asked Questions</h1>
          <p className="page-subtitle">Everything you need to know about Mix My Boba.</p>
        </div>
        {faqs.map((section, i) => (
          <div key={i} className="faq-category">
            <h2 className="faq-category-title">{section.category}</h2>
            {section.items.map((faq, j) => (
              <details key={j} className="faq-item">
                <summary className="faq-question">{faq.q}</summary>
                <p className="faq-answer">{faq.a}</p>
              </details>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
