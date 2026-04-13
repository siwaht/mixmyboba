import type { Metadata } from 'next'
import { getCachedJson } from '@/lib/settings-cache'

export const metadata: Metadata = {
  title: 'Our Story — From Boba Lovers, For Boba Lovers',
  description: 'Learn about Mix My Boba — how two boba-obsessed friends created premium instant boba tea mixes so everyone can enjoy boba shop taste at home, every single day.',
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
  const pageSubtitle = (about.pageSubtitle as string) || 'From boba lovers, for boba lovers.'

  const defaultSections: AboutSection[] = [
    { icon: '🧋', title: 'How It Started', content: 'We were spending $8-10 a day on boba runs. Every. Single. Day. We loved the ritual — the creamy milk tea, the chewy pearls, the moment of pure joy in every sip. But our wallets? Not so much. We knew there had to be a better way to get that boba shop experience without the boba shop price tag. So we set out to create it ourselves.' },
    { icon: '🍵', title: 'What Makes Us Different', content: "Real whole tea leaves, finely milled — not artificial tea flavoring\nNaturally sweetened with no refined sugar or artificial ingredients\nEach bag has 20+ servings — that's less than $2 a cup\nReady in 60 seconds — scoop, mix, done\nWorks hot or iced, with any milk, at any sweetness level\nPlant-based friendly options for every flavor", isList: true },
    { icon: '💜', title: 'Our Mission', content: 'We believe everyone deserves a daily boba moment — not just people who live near a boba shop or can afford $10 drinks every day. Mix My Boba is about making that joy accessible, affordable, and customizable. Your drink, your way, every single day.' },
    { icon: '🌱', title: 'Our Ingredients Promise', content: "We source premium tea leaves and use only clean, recognizable ingredients. No artificial colors, no artificial flavors, no mystery powders. Every ingredient is something you can pronounce and feel good about putting in your body. We're transparent about what goes into every bag because we drink this stuff every day too." },
    { icon: '✉️', title: 'Get in Touch', content: 'Questions, wholesale inquiries, or just want to share your boba creations with us?', contactEmail: 'hello@mixmyboba.com', contactNote: 'We respond within 24 hours. Follow us @mixmyboba for recipes and inspo!' },
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
