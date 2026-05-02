import Link from 'next/link'
import { Shield } from 'lucide-react'
import { getCachedJson } from '@/lib/settings-cache'
import { DEFAULT_PAGE_CONTENT, type FooterData } from '@/lib/default-page-content'
import FooterLogoLink from './FooterLogoLink'

const defaultFooter: FooterData = DEFAULT_PAGE_CONTENT.footer

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
