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
        { q: 'How do I make it?', a: 'Add 1-2 tablespoons to a mug, pour in a few ounces of hot water and stir until dissolved, then top with your preferred milk — dairy, oat, almond, coconut, whatever you like. Works great hot or poured over ice. The whole thing takes about 45 seconds.' },
        { q: 'What flavors do you have?', a: 'Currently eight: Classic Milk Tea, Taro, Matcha, Brown Sugar, Thai Tea, Honeydew, Passion Fruit, and Strawberry. Each one has a different adaptogen stack tailored to its flavor profile. We rotate seasonal limited editions too.' },
        { q: 'How many cups do I get per bag?', a: 'Around 20-25 depending on how strong you like it. That puts each cup at roughly $1.25-$1.50 — a fraction of what you\'d pay at a boba shop.' },
        { q: 'Does it actually taste like real boba?', a: 'We use the same grade of tea leaves that quality boba shops use, and the flavor profiles are developed to match. The difference is you control the milk, sweetness, and toppings. Most of our repeat customers say they prefer it because they can dial it in exactly how they want.' },
        { q: 'Can I add boba pearls or toppings?', a: 'Definitely. Quick-cook tapioca pearls, popping boba, coconut jelly, grass jelly — all pair well. We recommend the 5-minute quick-cook pearls for the easiest experience.' },
      ],
    },
    {
      category: 'Ingredients & Dietary',
      items: [
        { q: 'What\'s in it?', a: 'The base is stone-milled whole tea leaves, organic date powder, coconut cream powder, and natural flavor extracts. Each flavor adds its own functional ingredients — adaptogens, vitamins, prebiotic fiber. Full ingredient lists are on every product page. No artificial anything.' },
        { q: 'Is it vegan?', a: 'The powder itself contains no dairy or animal products. Use any plant milk and you\'re fully vegan. We use coconut cream and oat milk powder as the creamer base.' },
        { q: 'How much caffeine?', a: 'Varies by flavor — roughly 25-50mg per serving from the tea leaves themselves. That\'s about half a cup of coffee. Our caffeine-free options are clearly marked on the product page.' },
        { q: 'Is it gluten-free?', a: 'Yes, all flavors are gluten-free. They are produced in a shared facility, so we can\'t guarantee zero cross-contact for people with severe allergies.' },
      ],
    },
    {
      category: 'Shipping & Orders',
      items: [
        { q: 'How quickly do orders ship?', a: 'Orders placed before 2pm EST on weekdays ship the same day. Standard delivery is 3-5 business days. Expedited options are available at checkout. Orders over $50 ship free.' },
        { q: 'Do you ship outside the US?', a: 'Not yet, but it\'s in the works. Drop your email in our newsletter and we\'ll let you know the moment international shipping goes live.' },
        { q: 'What if I don\'t like it?', a: 'We have a 30-day no-questions-asked guarantee. If you\'re not happy, email hello@mixmyboba.com and we\'ll sort it out — refund, replacement, or exchange. We\'d rather lose a sale than have you stuck with something you don\'t enjoy.' },
        { q: 'Do you have a subscription option?', a: 'Yes — subscribers save up to 20% on every order. Pick your flavors, set your delivery cadence, and swap or cancel anytime. No contracts, no hoops.' },
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
