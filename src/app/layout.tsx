import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import Link from 'next/link'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import ComplianceBanner from '@/components/ComplianceBanner'
import Toast from '@/components/Toast'
import ScrollToTop from '@/components/ScrollToTop'
import { Shield } from 'lucide-react'

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-inter', display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-outfit', display: 'swap' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0c0a10' },
    { media: '(prefers-color-scheme: light)', color: '#fef7f0' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://mixmyboba.com'),
  title: {
    default: 'Mix My Boba — Premium Bubble Tea Mixes | Make Boba at Home',
    template: '%s | Mix My Boba',
  },
  description: 'Premium instant boba tea mixes made with real tea and natural ingredients. Classic milk tea, taro, matcha, brown sugar — just add water and your favorite milk. Ready in 60 seconds. Shop now at mixmyboba.com.',
  keywords: ['boba tea', 'bubble tea', 'milk tea mix', 'instant boba', 'boba at home', 'taro milk tea', 'matcha latte', 'brown sugar boba', 'premix boba', 'tea latte powder', 'boba kit'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Mix My Boba',
    title: 'Mix My Boba — Premium Bubble Tea Mixes',
    description: 'Boba shop taste at home. Premium instant mixes with real tea, natural sweeteners, and zero artificial flavors. Ready in 60 seconds.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mix My Boba — Premium Bubble Tea Mixes',
    description: 'Boba shop taste at home. Premium instant mixes made with real tea. Ready in 60 seconds.',
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: process.env.SITE_URL || 'https://mixmyboba.com',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t='light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
          }}
        />
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <ComplianceBanner />
        <Navbar />
        <Toast />
        <main id="main-content" style={{ flex: 1 }}>{children}</main>
        <ScrollToTop />

        <footer className="footer" role="contentinfo">
          <div className="container">
            <div className="footer-grid">
              <div className="footer-brand">
                <Link href="/" className="logo footer-logo" aria-label="Mix My Boba homepage">
                  <span className="logo-emoji">🧋</span> <span>mix my</span> boba
                </Link>
                <p>Premium instant boba tea mixes made with real tea and natural ingredients. Your daily boba ritual, ready in 60 seconds. No boba shop needed.</p>
              </div>
              <nav className="footer-links" aria-label="Flavors">
                <h4>Flavors</h4>
                <ul>
                  <li><Link href="/?category=Classic#store">Classic Milk Tea</Link></li>
                  <li><Link href="/?category=Taro#store">Taro</Link></li>
                  <li><Link href="/?category=Matcha#store">Matcha</Link></li>
                  <li><Link href="/?category=Brown+Sugar#store">Brown Sugar</Link></li>
                  <li><Link href="/?category=Fruity#store">Fruity</Link></li>
                </ul>
              </nav>
              <nav className="footer-links" aria-label="Help">
                <h4>Help</h4>
                <ul>
                  <li><Link href="/compliance#how">How to Prepare</Link></li>
                  <li><Link href="/compliance#ingredients">Ingredients</Link></li>
                  <li><Link href="/faq">FAQ</Link></li>
                  <li><Link href="/about">Our Story</Link></li>
                </ul>
              </nav>
              <nav className="footer-links" aria-label="Legal">
                <h4>Legal</h4>
                <ul>
                  <li><Link href="/compliance#terms">Terms of Service</Link></li>
                  <li><Link href="/compliance#privacy">Privacy Policy</Link></li>
                  <li><Link href="/compliance#returns">Return Policy</Link></li>
                  <li><Link href="/compliance#shipping">Shipping Info</Link></li>
                </ul>
              </nav>
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
      </body>
    </html>
  )
}
