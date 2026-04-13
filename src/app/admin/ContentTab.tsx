'use client'

interface SiteSettings {
  hero: {
    title: string; titleHighlight: string; subtitle: string
    ctaPrimary: { text: string; href: string }
    ctaSecondary: { text: string; href: string }
  }
  trustBadges: { icon: string; label: string }[]
  marqueeItems: string[]
  statsBar: { value: string; label: string }[]
  announcement: string
  announcementLink?: string
  announcementLinkText?: string
}

interface Props {
  settings: SiteSettings
  setSettings: (s: SiteSettings) => void
  onSave: () => void
  saved: boolean
}

export default function ContentTab({ settings, setSettings, onSave, saved }: Props) {
  const updateHero = (key: string, value: string) => {
    setSettings({ ...settings, hero: { ...settings.hero, [key]: value } })
  }

  const updateCta = (which: 'ctaPrimary' | 'ctaSecondary', key: string, value: string) => {
    setSettings({
      ...settings,
      hero: { ...settings.hero, [which]: { ...settings.hero[which], [key]: value } },
    })
  }

  const updateBadge = (index: number, key: 'icon' | 'label', value: string) => {
    const badges = [...settings.trustBadges]
    badges[index] = { ...badges[index], [key]: value }
    setSettings({ ...settings, trustBadges: badges })
  }

  const addBadge = () => {
    setSettings({ ...settings, trustBadges: [...settings.trustBadges, { icon: '⭐', label: 'New Badge' }] })
  }

  const removeBadge = (index: number) => {
    setSettings({ ...settings, trustBadges: settings.trustBadges.filter((_, i) => i !== index) })
  }

  // Marquee items
  const marqueeItems = settings.marqueeItems ?? []

  const updateMarqueeItem = (index: number, value: string) => {
    const items = [...marqueeItems]
    items[index] = value
    setSettings({ ...settings, marqueeItems: items })
  }

  const addMarqueeItem = () => {
    setSettings({ ...settings, marqueeItems: [...marqueeItems, 'New Item'] })
  }

  const removeMarqueeItem = (index: number) => {
    setSettings({ ...settings, marqueeItems: marqueeItems.filter((_, i) => i !== index) })
  }

  // Stats bar
  const statsBar = settings.statsBar ?? []

  const updateStat = (index: number, key: 'value' | 'label', value: string) => {
    const stats = [...statsBar]
    stats[index] = { ...stats[index], [key]: value }
    setSettings({ ...settings, statsBar: stats })
  }

  const addStat = () => {
    setSettings({ ...settings, statsBar: [...statsBar, { value: '0', label: 'New Stat' }] })
  }

  const removeStat = (index: number) => {
    setSettings({ ...settings, statsBar: statsBar.filter((_, i) => i !== index) })
  }

  return (
    <>
      {/* Hero Section */}
      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="admin-card-title">Hero Section</h3>
        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <label className="form-label">
            Title
            <input className="form-input" value={settings.hero.title} onChange={e => updateHero('title', e.target.value)} />
          </label>
          <label className="form-label">
            Highlighted Text
            <input className="form-input" value={settings.hero.titleHighlight} onChange={e => updateHero('titleHighlight', e.target.value)} />
          </label>
        </div>
        <label className="form-label">
          Subtitle
          <textarea className="form-input" rows={2} value={settings.hero.subtitle} onChange={e => updateHero('subtitle', e.target.value)} />
        </label>
        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', marginTop: '0.5rem' }}>
          <label className="form-label">
            Primary CTA Text
            <input className="form-input" value={settings.hero.ctaPrimary.text} onChange={e => updateCta('ctaPrimary', 'text', e.target.value)} />
          </label>
          <label className="form-label">
            Primary CTA Link
            <input className="form-input" value={settings.hero.ctaPrimary.href} onChange={e => updateCta('ctaPrimary', 'href', e.target.value)} />
          </label>
          <label className="form-label">
            Secondary CTA Text
            <input className="form-input" value={settings.hero.ctaSecondary.text} onChange={e => updateCta('ctaSecondary', 'text', e.target.value)} />
          </label>
          <label className="form-label">
            Secondary CTA Link
            <input className="form-input" value={settings.hero.ctaSecondary.href} onChange={e => updateCta('ctaSecondary', 'href', e.target.value)} />
          </label>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="admin-card-title">
          Trust Badges
          <button className="admin-link-btn" onClick={addBadge}>+ Add Badge</button>
        </h3>
        <div className="admin-badges-editor">
          {settings.trustBadges.map((badge, i) => (
            <div key={i} className="admin-badge-row">
              <input
                className="form-input"
                value={badge.icon}
                onChange={e => updateBadge(i, 'icon', e.target.value)}
                style={{ width: 60, textAlign: 'center' }}
                placeholder="🔬"
              />
              <input
                className="form-input"
                value={badge.label}
                onChange={e => updateBadge(i, 'label', e.target.value)}
                style={{ flex: 1 }}
                placeholder="Badge label"
              />
              <button className="admin-action-btn admin-action-danger" onClick={() => removeBadge(i)}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee Items */}
      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="admin-card-title">
          Scrolling Marquee
          <button className="admin-link-btn" onClick={addMarqueeItem}>+ Add Item</button>
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          These items scroll across the trust bar below the hero section.
        </p>
        <div className="admin-badges-editor">
          {marqueeItems.map((item, i) => (
            <div key={i} className="admin-badge-row">
              <input
                className="form-input"
                value={item}
                onChange={e => updateMarqueeItem(i, e.target.value)}
                style={{ flex: 1 }}
                placeholder="Marquee text"
              />
              <button className="admin-action-btn admin-action-danger" onClick={() => removeMarqueeItem(i)}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="admin-card-title">
          Stats Bar
          <button className="admin-link-btn" onClick={addStat}>+ Add Stat</button>
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Key statistics displayed below the marquee (e.g. &quot;99.8%&quot; / &quot;Minimum Purity&quot;).
        </p>
        <div className="admin-badges-editor">
          {statsBar.map((stat, i) => (
            <div key={i} className="admin-badge-row">
              <input
                className="form-input"
                value={stat.value}
                onChange={e => updateStat(i, 'value', e.target.value)}
                style={{ width: 120 }}
                placeholder="Value"
              />
              <input
                className="form-input"
                value={stat.label}
                onChange={e => updateStat(i, 'label', e.target.value)}
                style={{ flex: 1 }}
                placeholder="Label"
              />
              <button className="admin-action-btn admin-action-danger" onClick={() => removeStat(i)}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Announcement Banner */}
      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="admin-card-title">Announcement Banner</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          This banner appears at the very top of the site. Leave the text empty to hide it.
        </p>
        <label className="form-label">
          Banner Text
          <input className="form-input" value={settings.announcement} onChange={e => setSettings({ ...settings, announcement: e.target.value })} placeholder="e.g. Free shipping on orders over $50 — use code FIRSTSIP for 15% off!" />
        </label>
        <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '0.5rem' }}>
          <label className="form-label">
            Link URL (optional)
            <input className="form-input" value={settings.announcementLink ?? ''} onChange={e => setSettings({ ...settings, announcementLink: e.target.value })} placeholder="e.g. /#store" />
          </label>
          <label className="form-label">
            Link Text (optional)
            <input className="form-input" value={settings.announcementLinkText ?? ''} onChange={e => setSettings({ ...settings, announcementLinkText: e.target.value })} placeholder="e.g. Shop now →" />
          </label>
        </div>
        {settings.announcement && (
          <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: 'var(--bg-warm)', borderRadius: '0.5rem', fontSize: '0.85rem', textAlign: 'center' }}>
            🧋 {settings.announcement}
            {settings.announcementLink && (
              <> <a href={settings.announcementLink} style={{ color: 'var(--accent)', fontWeight: 500 }}>{settings.announcementLinkText || 'Learn more →'}</a></>
            )}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="admin-card-title">Preview</h3>
        <div className="admin-preview-hero">
          <h2>{settings.hero.title} <span className="premium-gradient-text">{settings.hero.titleHighlight}</span></h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{settings.hero.subtitle}</p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <span className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>{settings.hero.ctaPrimary.text}</span>
            <span className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>{settings.hero.ctaSecondary.text}</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {settings.trustBadges.map((b, i) => (
              <span key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.icon} {b.label}</span>
            ))}
          </div>
          {marqueeItems.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '0.5rem 0', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Marquee: {marqueeItems.join(' · ')}
            </div>
          )}
          {statsBar.length > 0 && (
            <div style={{ display: 'flex', gap: '2rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {statsBar.map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)' }}>{s.value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-primary" onClick={onSave}>Save Changes</button>
        {saved && <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>✓ Saved successfully</span>}
      </div>
    </>
  )
}
