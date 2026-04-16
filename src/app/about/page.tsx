import type { Metadata } from 'next'
import { getCachedJson } from '@/lib/settings-cache'

export const metadata: Metadata = {
  title: 'Our Story — We Built the Boba We Couldn\'t Find',
  description: 'Learn about Mix My Boba — why we created craft-quality boba tea mixes with whole-leaf tea, date sweetener, and functional adaptogens you can make at home.',
}

interface AboutSection {
  icon: string
  title: string
  content: string
  isList?: boolean
  contactEmail?: string
  contactNote?: string
}

export default async function AboutPage() {
  const pc = await getCachedJson<Record<string, unknown>>('page-content.json', {})
  const about = (pc.about ?? {}) as Record<string, unknown>

  const pageTitle = (about.pageTitle as string) || 'Our Story'
  const pageSubtitle = (about.pageSubtitle as string) || 'We built the boba we couldn\'t find anywhere else.'

  const defaultSections: AboutSection[] = [
    { icon: '🧋', title: 'The Problem We Kept Running Into', content: 'We\'re lifelong boba drinkers. But every instant mix we tried was the same story — artificial flavors, mystery creamers, and enough sugar to make your teeth hurt. The good stuff only existed at boba shops, and at $8-10 a pop, that daily habit adds up fast. We wanted something we could make at home that didn\'t feel like a downgrade.' },
    { icon: '🍵', title: 'So We Made It Ourselves', content: "Stone-milled whole tea leaves — not tea-flavored powder\nOrganic date sweetener instead of refined sugar or artificial alternatives\n20+ servings per bag, working out to under $2 each\nReady in under a minute — no blender, no brewing, no fuss\nWorks hot, iced, with any milk, at any sweetness level\nEvery flavor includes targeted adaptogens and vitamins", isList: true },
    { icon: '💜', title: 'What Drives Us', content: 'Boba shouldn\'t be a luxury or a guilty pleasure. It should be an everyday thing — affordable, customizable, and made with ingredients you\'d actually choose to put in your body. That\'s the standard we hold ourselves to with every flavor we develop.' },
    { icon: '🌱', title: 'Our Ingredient Standards', content: "We source single-origin tea leaves and vet every supplier. No artificial colors, no synthetic flavors, no preservatives, no fillers. Every ingredient on our label is something you recognize. We publish full ingredient breakdowns on every product page because transparency isn't optional — it's the baseline." },
    { icon: '✉️', title: 'Say Hi', content: 'Questions, wholesale inquiries, or just want to show us your boba creations?', contactEmail: 'hello@mixmyboba.com', contactNote: 'We reply within 24 hours. Tag us @mixmyboba — we love seeing what you make.' },
  ]
  const sections = (Array.isArray(about.sections) && about.sections.length) ? about.sections as AboutSection[] : defaultSections

  return (
    <section className="content-page">
      <div className="container" style={{ maxWidth: 780 }}>
        <div className="content-page-header">
          <h1>{pageTitle.includes(' ') ? <>{pageTitle.split(' ').slice(0, -1).join(' ')} <span className="premium-gradient-text">{pageTitle.split(' ').slice(-1)}</span></> : <span className="premium-gradient-text">{pageTitle}</span>}</h1>
          <p className="page-subtitle">{pageSubtitle}</p>
        </div>

        {sections.map((s, i) => (
          <div key={i} className="content-card glass">
            <div className="content-card-icon" aria-hidden="true">{s.icon}</div>
            <h2>{s.title}</h2>
            {s.isList ? (
              <ul className="feature-list">
                {s.content.split('\n').map((line, j) => <li key={j}>{line}</li>)}
              </ul>
            ) : (
              <p>{s.content}</p>
            )}
            {s.contactEmail && <p className="contact-email">{s.contactEmail}</p>}
            {s.contactNote && <p className="contact-note">{s.contactNote}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}
