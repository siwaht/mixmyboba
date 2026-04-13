'use client'

import { useState } from 'react'

interface PageContent {
  navbar: {
    logoEmoji: string
    logoText: string
    links: { label: string; href: string }[]
  }
  homepage: {
    heroBadge: string
    heroTitle: string
    heroHighlight: string
    heroSubtitle: string
    heroPrimaryCta: { text: string; href: string }
    heroSecondaryCta: { text: string; href: string }
    marquee2: string[]
    featureCards: { icon: string; title: string; description: string }[]
    comparison: {
      title: string; subtitle: string
      themLabel: string; themItems: string[]
      usLabel: string; usItems: string[]
    }
    storeSection: { title: string; subtitle: string }
    processSection: {
      title: string; subtitle: string
      steps: { num: string; title: string; description: string }[]
    }
    vibeSection: {
      title: string; subtitle: string
      cards: { emoji: string; stat: string; title: string; description: string }[]
    }
    ctaSection: {
      title: string; description: string
      primaryCta: { text: string; href: string }
      secondaryCta: { text: string; href: string }
    }
  }
  about: {
    pageTitle: string; pageSubtitle: string
    sections: { icon: string; title: string; content: string; isList?: boolean; contactEmail?: string; contactNote?: string }[]
  }
  faq: { category: string; items: { q: string; a: string }[] }[]
  policies: { id: string; icon: string; title: string; content: string }[]
  footer: {
    brandDescription: string
    sections: { title: string; links: { label: string; href: string }[]; comingSoon?: string }[]
  }
  seo: { siteTitle: string; siteDescription: string; siteKeywords: string }
}

interface Props {
  content: PageContent
  setContent: (c: PageContent) => void
  onSave: () => void
  saved: boolean
}

type Section = 'navbar' | 'hero' | 'homepage-sections' | 'about' | 'faq' | 'policies' | 'footer' | 'seo'

export default function PagesTab({ content, setContent, onSave, saved }: Props) {
  const [activeSection, setActiveSection] = useState<Section>('hero')

  const sections: { key: Section; label: string; icon: string }[] = [
    { key: 'navbar', label: 'Navigation', icon: '🧭' },
    { key: 'hero', label: 'Hero & Marquee', icon: '🏠' },
    { key: 'homepage-sections', label: 'Homepage Sections', icon: '📄' },
    { key: 'about', label: 'About Page', icon: '💜' },
    { key: 'faq', label: 'FAQ', icon: '❓' },
    { key: 'policies', label: 'Policies', icon: '📜' },
    { key: 'footer', label: 'Footer', icon: '🦶' },
    { key: 'seo', label: 'SEO & Meta', icon: '🔍' },
  ]

  const hp = content.homepage

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {sections.map(s => (
          <button
            key={s.key}
            className={`admin-tab-btn ${activeSection === s.key ? 'active' : ''}`}
            onClick={() => setActiveSection(s.key)}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: activeSection === s.key ? 'var(--accent)' : 'var(--bg-card)', color: activeSection === s.key ? '#fff' : 'var(--text-primary)', cursor: 'pointer' }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ── Navigation ── */}
      {activeSection === 'navbar' && (
        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="admin-card-title">Navigation Bar</h3>
          <div className="admin-form-grid" style={{ gridTemplateColumns: '80px 1fr' }}>
            <label className="form-label">
              Logo Emoji
              <input className="form-input" value={content.navbar.logoEmoji} onChange={e => setContent({ ...content, navbar: { ...content.navbar, logoEmoji: e.target.value } })} style={{ textAlign: 'center' }} />
            </label>
            <label className="form-label">
              Logo Text
              <input className="form-input" value={content.navbar.logoText} onChange={e => setContent({ ...content, navbar: { ...content.navbar, logoText: e.target.value } })} />
            </label>
          </div>
          <h4 style={{ marginTop: '1rem', fontSize: '0.85rem' }}>Nav Links</h4>
          <div className="admin-badges-editor">
            {content.navbar.links.map((link, i) => (
              <div key={i} className="admin-badge-row">
                <input className="form-input" value={link.label} onChange={e => { const links = [...content.navbar.links]; links[i] = { ...links[i], label: e.target.value }; setContent({ ...content, navbar: { ...content.navbar, links } }) }} style={{ width: 120 }} placeholder="Label" />
                <input className="form-input" value={link.href} onChange={e => { const links = [...content.navbar.links]; links[i] = { ...links[i], href: e.target.value }; setContent({ ...content, navbar: { ...content.navbar, links } }) }} style={{ flex: 1 }} placeholder="/path" />
                <button className="admin-action-btn admin-action-danger" onClick={() => { const links = content.navbar.links.filter((_, j) => j !== i); setContent({ ...content, navbar: { ...content.navbar, links } }) }}>✕</button>
              </div>
            ))}
            <button className="admin-link-btn" onClick={() => setContent({ ...content, navbar: { ...content.navbar, links: [...content.navbar.links, { label: 'New', href: '/' }] } })}>+ Add Link</button>
          </div>
        </div>
      )}

      {/* ── Hero & Marquee ── */}
      {activeSection === 'hero' && (
        <>
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">Hero Section</h3>
            <label className="form-label">
              Badge Text
              <input className="form-input" value={hp.heroBadge} onChange={e => setContent({ ...content, homepage: { ...hp, heroBadge: e.target.value } })} />
            </label>
            <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <label className="form-label">
                Title
                <input className="form-input" value={hp.heroTitle} onChange={e => setContent({ ...content, homepage: { ...hp, heroTitle: e.target.value } })} />
              </label>
              <label className="form-label">
                Highlighted Text
                <input className="form-input" value={hp.heroHighlight} onChange={e => setContent({ ...content, homepage: { ...hp, heroHighlight: e.target.value } })} />
              </label>
            </div>
            <label className="form-label">
              Subtitle
              <textarea className="form-input" rows={2} value={hp.heroSubtitle} onChange={e => setContent({ ...content, homepage: { ...hp, heroSubtitle: e.target.value } })} />
            </label>
            <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', marginTop: '0.5rem' }}>
              <label className="form-label">Primary CTA Text<input className="form-input" value={hp.heroPrimaryCta.text} onChange={e => setContent({ ...content, homepage: { ...hp, heroPrimaryCta: { ...hp.heroPrimaryCta, text: e.target.value } } })} /></label>
              <label className="form-label">Primary CTA Link<input className="form-input" value={hp.heroPrimaryCta.href} onChange={e => setContent({ ...content, homepage: { ...hp, heroPrimaryCta: { ...hp.heroPrimaryCta, href: e.target.value } } })} /></label>
              <label className="form-label">Secondary CTA Text<input className="form-input" value={hp.heroSecondaryCta.text} onChange={e => setContent({ ...content, homepage: { ...hp, heroSecondaryCta: { ...hp.heroSecondaryCta, text: e.target.value } } })} /></label>
              <label className="form-label">Secondary CTA Link<input className="form-input" value={hp.heroSecondaryCta.href} onChange={e => setContent({ ...content, homepage: { ...hp, heroSecondaryCta: { ...hp.heroSecondaryCta, href: e.target.value } } })} /></label>
            </div>
          </div>
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">Second Marquee <button className="admin-link-btn" onClick={() => setContent({ ...content, homepage: { ...hp, marquee2: [...hp.marquee2, 'New Item'] } })}>+ Add</button></h3>
            <div className="admin-badges-editor">
              {hp.marquee2.map((item, i) => (
                <div key={i} className="admin-badge-row">
                  <input className="form-input" value={item} onChange={e => { const m = [...hp.marquee2]; m[i] = e.target.value; setContent({ ...content, homepage: { ...hp, marquee2: m } }) }} style={{ flex: 1 }} />
                  <button className="admin-action-btn admin-action-danger" onClick={() => setContent({ ...content, homepage: { ...hp, marquee2: hp.marquee2.filter((_, j) => j !== i) } })}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Homepage Sections ── */}
      {activeSection === 'homepage-sections' && (
        <>
          {/* Feature Cards */}
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">Feature Cards <button className="admin-link-btn" onClick={() => setContent({ ...content, homepage: { ...hp, featureCards: [...hp.featureCards, { icon: 'Coffee', title: 'New Feature', description: 'Description' }] } })}>+ Add</button></h3>
            {hp.featureCards.map((card, i) => (
              <div key={i} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                <div className="admin-form-grid" style={{ gridTemplateColumns: '100px 1fr auto' }}>
                  <label className="form-label">Icon<select className="form-input" value={card.icon} onChange={e => { const cards = [...hp.featureCards]; cards[i] = { ...cards[i], icon: e.target.value }; setContent({ ...content, homepage: { ...hp, featureCards: cards } }) }}><option value="Coffee">Coffee</option><option value="Leaf">Leaf</option><option value="Heart">Heart</option></select></label>
                  <label className="form-label">Title<input className="form-input" value={card.title} onChange={e => { const cards = [...hp.featureCards]; cards[i] = { ...cards[i], title: e.target.value }; setContent({ ...content, homepage: { ...hp, featureCards: cards } }) }} /></label>
                  <button className="admin-action-btn admin-action-danger" style={{ alignSelf: 'end', marginBottom: '0.25rem' }} onClick={() => setContent({ ...content, homepage: { ...hp, featureCards: hp.featureCards.filter((_, j) => j !== i) } })}>✕</button>
                </div>
                <label className="form-label">Description<textarea className="form-input" rows={2} value={card.description} onChange={e => { const cards = [...hp.featureCards]; cards[i] = { ...cards[i], description: e.target.value }; setContent({ ...content, homepage: { ...hp, featureCards: cards } }) }} /></label>
              </div>
            ))}
          </div>

          {/* Comparison */}
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">Comparison Section</h3>
            <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <label className="form-label">Title<input className="form-input" value={hp.comparison.title} onChange={e => setContent({ ...content, homepage: { ...hp, comparison: { ...hp.comparison, title: e.target.value } } })} /></label>
              <label className="form-label">Subtitle<input className="form-input" value={hp.comparison.subtitle} onChange={e => setContent({ ...content, homepage: { ...hp, comparison: { ...hp.comparison, subtitle: e.target.value } } })} /></label>
            </div>
            <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '0.75rem' }}>
              <div>
                <label className="form-label">&quot;Them&quot; Label<input className="form-input" value={hp.comparison.themLabel} onChange={e => setContent({ ...content, homepage: { ...hp, comparison: { ...hp.comparison, themLabel: e.target.value } } })} /></label>
                {hp.comparison.themItems.map((item, i) => (
                  <div key={i} className="admin-badge-row" style={{ marginTop: '0.25rem' }}>
                    <input className="form-input" value={item} onChange={e => { const items = [...hp.comparison.themItems]; items[i] = e.target.value; setContent({ ...content, homepage: { ...hp, comparison: { ...hp.comparison, themItems: items } } }) }} style={{ flex: 1 }} />
                    <button className="admin-action-btn admin-action-danger" onClick={() => setContent({ ...content, homepage: { ...hp, comparison: { ...hp.comparison, themItems: hp.comparison.themItems.filter((_, j) => j !== i) } } })}>✕</button>
                  </div>
                ))}
                <button className="admin-link-btn" style={{ marginTop: '0.25rem' }} onClick={() => setContent({ ...content, homepage: { ...hp, comparison: { ...hp.comparison, themItems: [...hp.comparison.themItems, 'New item'] } } })}>+ Add</button>
              </div>
              <div>
                <label className="form-label">&quot;Us&quot; Label<input className="form-input" value={hp.comparison.usLabel} onChange={e => setContent({ ...content, homepage: { ...hp, comparison: { ...hp.comparison, usLabel: e.target.value } } })} /></label>
                {hp.comparison.usItems.map((item, i) => (
                  <div key={i} className="admin-badge-row" style={{ marginTop: '0.25rem' }}>
                    <input className="form-input" value={item} onChange={e => { const items = [...hp.comparison.usItems]; items[i] = e.target.value; setContent({ ...content, homepage: { ...hp, comparison: { ...hp.comparison, usItems: items } } }) }} style={{ flex: 1 }} />
                    <button className="admin-action-btn admin-action-danger" onClick={() => setContent({ ...content, homepage: { ...hp, comparison: { ...hp.comparison, usItems: hp.comparison.usItems.filter((_, j) => j !== i) } } })}>✕</button>
                  </div>
                ))}
                <button className="admin-link-btn" style={{ marginTop: '0.25rem' }} onClick={() => setContent({ ...content, homepage: { ...hp, comparison: { ...hp.comparison, usItems: [...hp.comparison.usItems, 'New item'] } } })}>+ Add</button>
              </div>
            </div>
          </div>

          {/* Store Section */}
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">Store Section</h3>
            <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <label className="form-label">Title<input className="form-input" value={hp.storeSection.title} onChange={e => setContent({ ...content, homepage: { ...hp, storeSection: { ...hp.storeSection, title: e.target.value } } })} /></label>
              <label className="form-label">Subtitle<input className="form-input" value={hp.storeSection.subtitle} onChange={e => setContent({ ...content, homepage: { ...hp, storeSection: { ...hp.storeSection, subtitle: e.target.value } } })} /></label>
            </div>
          </div>

          {/* Process Steps */}
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">Process Steps <button className="admin-link-btn" onClick={() => setContent({ ...content, homepage: { ...hp, processSection: { ...hp.processSection, steps: [...hp.processSection.steps, { num: String(hp.processSection.steps.length + 1).padStart(2, '0'), title: 'New Step', description: 'Description' }] } } })}>+ Add</button></h3>
            <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <label className="form-label">Section Title<input className="form-input" value={hp.processSection.title} onChange={e => setContent({ ...content, homepage: { ...hp, processSection: { ...hp.processSection, title: e.target.value } } })} /></label>
              <label className="form-label">Section Subtitle<input className="form-input" value={hp.processSection.subtitle} onChange={e => setContent({ ...content, homepage: { ...hp, processSection: { ...hp.processSection, subtitle: e.target.value } } })} /></label>
            </div>
            {hp.processSection.steps.map((step, i) => (
              <div key={i} className="admin-badge-row" style={{ marginTop: '0.5rem' }}>
                <input className="form-input" value={step.num} onChange={e => { const steps = [...hp.processSection.steps]; steps[i] = { ...steps[i], num: e.target.value }; setContent({ ...content, homepage: { ...hp, processSection: { ...hp.processSection, steps } } }) }} style={{ width: 50 }} />
                <input className="form-input" value={step.title} onChange={e => { const steps = [...hp.processSection.steps]; steps[i] = { ...steps[i], title: e.target.value }; setContent({ ...content, homepage: { ...hp, processSection: { ...hp.processSection, steps } } }) }} style={{ width: 120 }} />
                <input className="form-input" value={step.description} onChange={e => { const steps = [...hp.processSection.steps]; steps[i] = { ...steps[i], description: e.target.value }; setContent({ ...content, homepage: { ...hp, processSection: { ...hp.processSection, steps } } }) }} style={{ flex: 1 }} />
                <button className="admin-action-btn admin-action-danger" onClick={() => setContent({ ...content, homepage: { ...hp, processSection: { ...hp.processSection, steps: hp.processSection.steps.filter((_, j) => j !== i) } } })}>✕</button>
              </div>
            ))}
          </div>

          {/* Vibe Cards */}
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">Vibe Section <button className="admin-link-btn" onClick={() => setContent({ ...content, homepage: { ...hp, vibeSection: { ...hp.vibeSection, cards: [...hp.vibeSection.cards, { emoji: '✨', stat: '0', title: 'New', description: 'Description' }] } } })}>+ Add Card</button></h3>
            <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <label className="form-label">Section Title<input className="form-input" value={hp.vibeSection.title} onChange={e => setContent({ ...content, homepage: { ...hp, vibeSection: { ...hp.vibeSection, title: e.target.value } } })} /></label>
              <label className="form-label">Section Subtitle<input className="form-input" value={hp.vibeSection.subtitle} onChange={e => setContent({ ...content, homepage: { ...hp, vibeSection: { ...hp.vibeSection, subtitle: e.target.value } } })} /></label>
            </div>
            {hp.vibeSection.cards.map((card, i) => (
              <div key={i} style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
                <div className="admin-form-grid" style={{ gridTemplateColumns: '60px 80px 1fr auto' }}>
                  <label className="form-label">Emoji<input className="form-input" value={card.emoji} onChange={e => { const cards = [...hp.vibeSection.cards]; cards[i] = { ...cards[i], emoji: e.target.value }; setContent({ ...content, homepage: { ...hp, vibeSection: { ...hp.vibeSection, cards } } }) }} style={{ textAlign: 'center' }} /></label>
                  <label className="form-label">Stat<input className="form-input" value={card.stat} onChange={e => { const cards = [...hp.vibeSection.cards]; cards[i] = { ...cards[i], stat: e.target.value }; setContent({ ...content, homepage: { ...hp, vibeSection: { ...hp.vibeSection, cards } } }) }} /></label>
                  <label className="form-label">Title<input className="form-input" value={card.title} onChange={e => { const cards = [...hp.vibeSection.cards]; cards[i] = { ...cards[i], title: e.target.value }; setContent({ ...content, homepage: { ...hp, vibeSection: { ...hp.vibeSection, cards } } }) }} /></label>
                  <button className="admin-action-btn admin-action-danger" style={{ alignSelf: 'end', marginBottom: '0.25rem' }} onClick={() => setContent({ ...content, homepage: { ...hp, vibeSection: { ...hp.vibeSection, cards: hp.vibeSection.cards.filter((_, j) => j !== i) } } })}>✕</button>
                </div>
                <label className="form-label">Description<textarea className="form-input" rows={2} value={card.description} onChange={e => { const cards = [...hp.vibeSection.cards]; cards[i] = { ...cards[i], description: e.target.value }; setContent({ ...content, homepage: { ...hp, vibeSection: { ...hp.vibeSection, cards } } }) }} /></label>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">CTA Section</h3>
            <label className="form-label">Title<input className="form-input" value={hp.ctaSection.title} onChange={e => setContent({ ...content, homepage: { ...hp, ctaSection: { ...hp.ctaSection, title: e.target.value } } })} /></label>
            <label className="form-label">Description<textarea className="form-input" rows={2} value={hp.ctaSection.description} onChange={e => setContent({ ...content, homepage: { ...hp, ctaSection: { ...hp.ctaSection, description: e.target.value } } })} /></label>
            <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', marginTop: '0.5rem' }}>
              <label className="form-label">Primary Text<input className="form-input" value={hp.ctaSection.primaryCta.text} onChange={e => setContent({ ...content, homepage: { ...hp, ctaSection: { ...hp.ctaSection, primaryCta: { ...hp.ctaSection.primaryCta, text: e.target.value } } } })} /></label>
              <label className="form-label">Primary Link<input className="form-input" value={hp.ctaSection.primaryCta.href} onChange={e => setContent({ ...content, homepage: { ...hp, ctaSection: { ...hp.ctaSection, primaryCta: { ...hp.ctaSection.primaryCta, href: e.target.value } } } })} /></label>
              <label className="form-label">Secondary Text<input className="form-input" value={hp.ctaSection.secondaryCta.text} onChange={e => setContent({ ...content, homepage: { ...hp, ctaSection: { ...hp.ctaSection, secondaryCta: { ...hp.ctaSection.secondaryCta, text: e.target.value } } } })} /></label>
              <label className="form-label">Secondary Link<input className="form-input" value={hp.ctaSection.secondaryCta.href} onChange={e => setContent({ ...content, homepage: { ...hp, ctaSection: { ...hp.ctaSection, secondaryCta: { ...hp.ctaSection.secondaryCta, href: e.target.value } } } })} /></label>
            </div>
          </div>
        </>
      )}

      {/* ── About Page ── */}
      {activeSection === 'about' && (
        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="admin-card-title">About Page <button className="admin-link-btn" onClick={() => setContent({ ...content, about: { ...content.about, sections: [...content.about.sections, { icon: '✨', title: 'New Section', content: 'Content here' }] } })}>+ Add Section</button></h3>
          <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label className="form-label">Page Title<input className="form-input" value={content.about.pageTitle} onChange={e => setContent({ ...content, about: { ...content.about, pageTitle: e.target.value } })} /></label>
            <label className="form-label">Page Subtitle<input className="form-input" value={content.about.pageSubtitle} onChange={e => setContent({ ...content, about: { ...content.about, pageSubtitle: e.target.value } })} /></label>
          </div>
          {content.about.sections.map((section, i) => (
            <div key={i} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', marginTop: '0.75rem' }}>
              <div className="admin-form-grid" style={{ gridTemplateColumns: '60px 1fr auto' }}>
                <label className="form-label">Icon<input className="form-input" value={section.icon} onChange={e => { const s = [...content.about.sections]; s[i] = { ...s[i], icon: e.target.value }; setContent({ ...content, about: { ...content.about, sections: s } }) }} style={{ textAlign: 'center' }} /></label>
                <label className="form-label">Title<input className="form-input" value={section.title} onChange={e => { const s = [...content.about.sections]; s[i] = { ...s[i], title: e.target.value }; setContent({ ...content, about: { ...content.about, sections: s } }) }} /></label>
                <button className="admin-action-btn admin-action-danger" style={{ alignSelf: 'end', marginBottom: '0.25rem' }} onClick={() => setContent({ ...content, about: { ...content.about, sections: content.about.sections.filter((_, j) => j !== i) } })}>✕</button>
              </div>
              <label className="form-label">Content {section.isList && '(one item per line)'}<textarea className="form-input" rows={3} value={section.content} onChange={e => { const s = [...content.about.sections]; s[i] = { ...s[i], content: e.target.value }; setContent({ ...content, about: { ...content.about, sections: s } }) }} /></label>
              <div className="admin-form-grid" style={{ gridTemplateColumns: 'auto 1fr 1fr', marginTop: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                  <input type="checkbox" checked={!!section.isList} onChange={e => { const s = [...content.about.sections]; s[i] = { ...s[i], isList: e.target.checked }; setContent({ ...content, about: { ...content.about, sections: s } }) }} /> List format
                </label>
                <label className="form-label">Contact Email<input className="form-input" value={section.contactEmail || ''} onChange={e => { const s = [...content.about.sections]; s[i] = { ...s[i], contactEmail: e.target.value }; setContent({ ...content, about: { ...content.about, sections: s } }) }} placeholder="Optional" /></label>
                <label className="form-label">Contact Note<input className="form-input" value={section.contactNote || ''} onChange={e => { const s = [...content.about.sections]; s[i] = { ...s[i], contactNote: e.target.value }; setContent({ ...content, about: { ...content.about, sections: s } }) }} placeholder="Optional" /></label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── FAQ ── */}
      {activeSection === 'faq' && (
        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="admin-card-title">FAQ <button className="admin-link-btn" onClick={() => setContent({ ...content, faq: [...content.faq, { category: 'New Category', items: [{ q: 'Question?', a: 'Answer.' }] }] })}>+ Add Category</button></h3>
          {content.faq.map((cat, ci) => (
            <div key={ci} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', marginTop: '0.75rem' }}>
              <div className="admin-badge-row">
                <input className="form-input" value={cat.category} onChange={e => { const faq = [...content.faq]; faq[ci] = { ...faq[ci], category: e.target.value }; setContent({ ...content, faq }) }} style={{ flex: 1, fontWeight: 600 }} />
                <button className="admin-link-btn" onClick={() => { const faq = [...content.faq]; faq[ci] = { ...faq[ci], items: [...faq[ci].items, { q: 'New question?', a: 'Answer.' }] }; setContent({ ...content, faq }) }}>+ Q&A</button>
                <button className="admin-action-btn admin-action-danger" onClick={() => setContent({ ...content, faq: content.faq.filter((_, j) => j !== ci) })}>✕</button>
              </div>
              {cat.items.map((item, qi) => (
                <div key={qi} style={{ marginTop: '0.5rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--border)' }}>
                  <div className="admin-badge-row">
                    <input className="form-input" value={item.q} onChange={e => { const faq = [...content.faq]; const items = [...faq[ci].items]; items[qi] = { ...items[qi], q: e.target.value }; faq[ci] = { ...faq[ci], items }; setContent({ ...content, faq }) }} style={{ flex: 1 }} placeholder="Question" />
                    <button className="admin-action-btn admin-action-danger" onClick={() => { const faq = [...content.faq]; faq[ci] = { ...faq[ci], items: faq[ci].items.filter((_, j) => j !== qi) }; setContent({ ...content, faq }) }}>✕</button>
                  </div>
                  <textarea className="form-input" rows={2} value={item.a} onChange={e => { const faq = [...content.faq]; const items = [...faq[ci].items]; items[qi] = { ...items[qi], a: e.target.value }; faq[ci] = { ...faq[ci], items }; setContent({ ...content, faq }) }} style={{ marginTop: '0.25rem' }} placeholder="Answer" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Policies ── */}
      {activeSection === 'policies' && (
        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="admin-card-title">Policies & Info <button className="admin-link-btn" onClick={() => setContent({ ...content, policies: [...content.policies, { id: 'new', icon: '📄', title: 'New Policy', content: 'Content here' }] })}>+ Add</button></h3>
          {content.policies.map((policy, i) => (
            <div key={i} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', marginTop: '0.75rem' }}>
              <div className="admin-form-grid" style={{ gridTemplateColumns: '80px 60px 1fr auto' }}>
                <label className="form-label">ID<input className="form-input" value={policy.id} onChange={e => { const p = [...content.policies]; p[i] = { ...p[i], id: e.target.value }; setContent({ ...content, policies: p }) }} /></label>
                <label className="form-label">Icon<input className="form-input" value={policy.icon} onChange={e => { const p = [...content.policies]; p[i] = { ...p[i], icon: e.target.value }; setContent({ ...content, policies: p }) }} style={{ textAlign: 'center' }} /></label>
                <label className="form-label">Title<input className="form-input" value={policy.title} onChange={e => { const p = [...content.policies]; p[i] = { ...p[i], title: e.target.value }; setContent({ ...content, policies: p }) }} /></label>
                <button className="admin-action-btn admin-action-danger" style={{ alignSelf: 'end', marginBottom: '0.25rem' }} onClick={() => setContent({ ...content, policies: content.policies.filter((_, j) => j !== i) })}>✕</button>
              </div>
              <label className="form-label">Content<textarea className="form-input" rows={4} value={policy.content} onChange={e => { const p = [...content.policies]; p[i] = { ...p[i], content: e.target.value }; setContent({ ...content, policies: p }) }} /></label>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      {activeSection === 'footer' && (
        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="admin-card-title">Footer</h3>
          <label className="form-label">Brand Description<textarea className="form-input" rows={2} value={content.footer.brandDescription} onChange={e => setContent({ ...content, footer: { ...content.footer, brandDescription: e.target.value } })} /></label>
          {content.footer.sections.map((section, si) => (
            <div key={si} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', marginTop: '0.75rem' }}>
              <div className="admin-badge-row">
                <input className="form-input" value={section.title} onChange={e => { const s = [...content.footer.sections]; s[si] = { ...s[si], title: e.target.value }; setContent({ ...content, footer: { ...content.footer, sections: s } }) }} style={{ width: 150, fontWeight: 600 }} />
                <input className="form-input" value={section.comingSoon || ''} onChange={e => { const s = [...content.footer.sections]; s[si] = { ...s[si], comingSoon: e.target.value }; setContent({ ...content, footer: { ...content.footer, sections: s } }) }} style={{ flex: 1 }} placeholder="Coming soon text (optional)" />
                <button className="admin-link-btn" onClick={() => { const s = [...content.footer.sections]; s[si] = { ...s[si], links: [...s[si].links, { label: 'New', href: '/' }] }; setContent({ ...content, footer: { ...content.footer, sections: s } }) }}>+ Link</button>
              </div>
              {section.links.map((link, li) => (
                <div key={li} className="admin-badge-row" style={{ marginTop: '0.25rem' }}>
                  <input className="form-input" value={link.label} onChange={e => { const s = [...content.footer.sections]; const links = [...s[si].links]; links[li] = { ...links[li], label: e.target.value }; s[si] = { ...s[si], links }; setContent({ ...content, footer: { ...content.footer, sections: s } }) }} style={{ width: 150 }} />
                  <input className="form-input" value={link.href} onChange={e => { const s = [...content.footer.sections]; const links = [...s[si].links]; links[li] = { ...links[li], href: e.target.value }; s[si] = { ...s[si], links }; setContent({ ...content, footer: { ...content.footer, sections: s } }) }} style={{ flex: 1 }} />
                  <button className="admin-action-btn admin-action-danger" onClick={() => { const s = [...content.footer.sections]; s[si] = { ...s[si], links: s[si].links.filter((_, j) => j !== li) }; setContent({ ...content, footer: { ...content.footer, sections: s } }) }}>✕</button>
                </div>
              ))}
            </div>
          ))}
          <button className="admin-link-btn" style={{ marginTop: '0.5rem' }} onClick={() => setContent({ ...content, footer: { ...content.footer, sections: [...content.footer.sections, { title: 'New Section', links: [] }] } })}>+ Add Footer Section</button>
        </div>
      )}

      {/* ── SEO ── */}
      {activeSection === 'seo' && (
        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="admin-card-title">SEO & Metadata</h3>
          <label className="form-label">Site Title<input className="form-input" value={content.seo.siteTitle} onChange={e => setContent({ ...content, seo: { ...content.seo, siteTitle: e.target.value } })} /></label>
          <label className="form-label">Site Description<textarea className="form-input" rows={2} value={content.seo.siteDescription} onChange={e => setContent({ ...content, seo: { ...content.seo, siteDescription: e.target.value } })} /></label>
          <label className="form-label">Keywords (comma-separated)<input className="form-input" value={content.seo.siteKeywords} onChange={e => setContent({ ...content, seo: { ...content.seo, siteKeywords: e.target.value } })} /></label>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-primary" onClick={onSave}>Save All Pages</button>
        {saved && <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>✓ Saved successfully</span>}
      </div>
    </>
  )
}
