import Link from 'next/link'
import { Shield } from 'lucide-react'
import { getCachedJson } from '@/lib/settings-cache'
import FooterLogoLink from './FooterLogoLink'

interface FooterLink { label: string; href: string }
interface FooterSection { title: string; links: FooterLink[]; comingSoon?: string }
interface FooterData { brandDescription: string; sections: FooterSection[] }

const defaultFooter: FooterData = {
  brandDescription: 'Premium instant boba tea mixes made with real tea and natural ingredients. Your daily boba ritual, ready in 60 seconds. No boba shop needed.',
  sections: [
    { title: 'Flavors', links: [{ label: 'Classic Milk Tea', href: '/?category=Classic#store' }, { label: 'Matcha', href: '/?category=Matcha#store' }, { label: 'Brown Sugar', href: '/?category=Brown+Sugar#store' }, { label: 'Fruity', href: '/?category=Fruity#store' }], comingSoon: 'Toppings — Coming Soon' },
    { title: 'Help', links: [{ label: 'How to Prepare', href: '/compliance#how' }, { label: 'Ingredients', href: '/compliance#ingredients' }, { label: 'FAQ', href: '/faq' }, { label: 'Our Story', href: '/about' }] },
    { title: 'Legal', links: [{ label: 'Terms of Service', href: '/compliance#terms' }, { label: 'Privacy Policy', href: '/compliance#privacy' }, { label: 'Return Policy', href: '/compliance#returns' }, { label: 'Shipping Info', href: '/compliance#shipping' }] },
  ],
}

export default async function Footer() {
  const pc = await getCachedJson<Record<string, unknown>>('page-content.json', {})
  const footer = (pc.footer as FooterData) || defaultFooter
  const navbar = (pc.navbar as { logoEmoji?: string; logoText?: string }) || {}
  const logoEmoji = navbar.logoEmoji || '🧋'
  const logoText = navbar.logoText || 'mix my boba'
  const [logoFirst, ...logoRest] = logoText.split(' ')

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <FooterLogoLink
              logoEmoji={logoEmoji}
              logoFirst={logoFirst}
              logoMiddle={logoRest.length > 1 ? logoRest.slice(0, -1).join(' ') : ''}
              logoLast={logoRest.length > 0 ? logoRest[logoRest.length - 1] : ''}
            />
            <p>{footer.brandDescription || defaultFooter.brandDescription}</p>
          </div>
          {(footer.sections || defaultFooter.sections).map((section, i) => (
            <nav key={i} className="footer-links" aria-label={section.title}>
              <h4>{section.title}</h4>
              <ul>
                {section.links.map((link, j) => (
                  <li key={j}><Link href={link.href}>{link.label}</Link></li>
                ))}
                {section.comingSoon && <li><span className="footer-coming-soon">{section.comingSoon}</span></li>}
              </ul>
            </nav>
          ))}
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Mix My Boba. All rights reserved.</p>
          <div className="footer-ssl">
            <Shield size={14} strokeWidth={1.5} aria-hidden="true" />
            Secure SSL Checkout
          </div>
        </div>
      </div>
    </footer>
  )
}
