import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Our Science — Research-Grade Peptides You Can Trust',
  description: 'Learn about Immortality Peptides — our commitment to 99%+ purity, third-party testing, and making premium research peptides accessible to everyone.',
}

export default function AboutPage() {
  return (
    <section className="content-page">
      <div className="container" style={{ maxWidth: 780 }}>
        <div className="content-page-header">
          <h1>Our <span className="premium-gradient-text">Story</span></h1>
          <p className="page-subtitle">From boba lovers, for boba lovers.</p>
        </div>

        <div className="content-card glass">
          <div className="content-card-icon" aria-hidden="true">🧋</div>
          <h2>How It Started</h2>
          <p>
            We were spending $8-10 a day on boba runs. Every. Single. Day. We loved the ritual — the creamy milk tea,
            the chewy pearls, the moment of pure joy in every sip. But our wallets? Not so much. We knew there had to
            be a better way to get that boba shop experience without the boba shop price tag. So we set out to create it ourselves.
          </p>
        </div>

        <div className="content-card glass">
          <div className="content-card-icon" aria-hidden="true">🍵</div>
          <h2>What Makes Us Different</h2>
          <ul className="feature-list">
            <li>Real whole tea leaves, finely milled — not artificial tea flavoring</li>
            <li>Naturally sweetened with no refined sugar or artificial ingredients</li>
            <li>Each bag has 20+ servings — that&apos;s less than $2 a cup</li>
            <li>Ready in 60 seconds — scoop, mix, done</li>
            <li>Works hot or iced, with any milk, at any sweetness level</li>
            <li>Plant-based friendly options for every flavor</li>
          </ul>
        </div>

        <div className="content-card glass">
          <div className="content-card-icon" aria-hidden="true">💜</div>
          <h2>Our Mission</h2>
          <p>
            We believe everyone deserves a daily boba moment — not just people who live near a boba shop or can afford
            $10 drinks every day. Mix My Boba is about making that joy accessible, affordable, and customizable.
            Your drink, your way, every single day.
          </p>
        </div>

        <div className="content-card glass">
          <div className="content-card-icon" aria-hidden="true">🌱</div>
          <h2>Our Ingredients Promise</h2>
          <p>
            We source premium tea leaves and use only clean, recognizable ingredients. No artificial colors,
            no artificial flavors, no mystery powders. Every ingredient is something you can pronounce and feel
            good about putting in your body. We&apos;re transparent about what goes into every bag because we drink
            this stuff every day too.
          </p>
        </div>

        <div className="content-card glass">
          <div className="content-card-icon" aria-hidden="true">✉️</div>
          <h2>Get in Touch</h2>
          <p>
            Questions, wholesale inquiries, or just want to share your boba creations with us?
          </p>
          <p className="contact-email">hello@mixmyboba.com</p>
          <p className="contact-note">We respond within 24 hours. Follow us @mixmyboba for recipes and inspo!</p>
        </div>
      </div>
    </section>
  )
}
