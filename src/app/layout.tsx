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
    { media: '(prefers-color-scheme: dark)', color: '#1a1520' },
    { media: '(prefers-color-scheme: light)', color: '#fef7f0' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://immortalitypeptides.com'),
  title: {
    default: 'Immortality Peptides — Research-Grade Peptides | 99%+ Purity',
    template: '%s | Immortality Peptides',
  },
  description: 'Premium research-grade peptides with 99%+ purity. BPC-157, TB-500, Semaglutide, and more. Third-party tested with COA. Fast shipping. Shop now.',
  keywords: ['peptides', 'research peptides', 'BPC-157', 'TB-500', 'semaglutide', 'CJC-1295', 'ipamorelin', 'peptide research', 'lab-grade peptides'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Immortality Peptides',
    title: 'Immortality Peptides — Research-Grade Peptides',
    description: 'Premium research-grade peptides with 99%+ purity. Third-party tested. COA included with every order.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Immortality Peptides — Research-Grade Peptides',
    description: 'Premium research-grade peptides with 99%+ purity. Third-party tested. Fast shipping.',
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: process.env.SITE_URL || 'https://immortalitypeptides.com',
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
                <Link href="/" className="logo footer-logo" aria-label="Immortality Peptides homepage">
                  <span className="logo-emoji">⚗️</span> <span>immortality</span> peptides
                </Link>
                <p>Premium research-grade peptides with 99%+ purity. Third-party tested with Certificate of Analysis. For research use only.</p>
              </div>
              <nav className="footer-links" aria-label="Categories">
                <h4>Categories</h4>
                <ul>
                  <li><Link href="/?category=Recovery#store">Recovery</Link></li>
                  <li><Link href="/?category=Weight+Loss#store">Weight Loss</Link></li>
                  <li><Link href="/?category=Anti-Aging#store">Anti-Aging</Link></li>
                  <li><Link href="/?category=Cognitive#store">Cognitive</Link></li>
                  <li><Link href="/?category=Performance#store">Performance</Link></li>
                </ul>
              </nav>
              <nav className="footer-links" aria-label="Help">
                <h4>Help</h4>
                <ul>
                  <li><Link href="/compliance#handling">Handling Guide</Link></li>
                  <li><Link href="/compliance#testing">Testing & COA</Link></li>
                  <li><Link href="/faq">FAQ</Link></li>
                  <li><Link href="/about">Our Science</Link></li>
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
              <p>© {new Date().getFullYear()} Immortality Peptides. All rights reserved. For research use only.</p>
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
