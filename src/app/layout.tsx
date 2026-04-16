import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import ComplianceBanner from '@/components/ComplianceBanner'
import Toast from '@/components/Toast'
import ScrollToTop from '@/components/ScrollToTop'
import Footer from '@/components/Footer'

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
  metadataBase: new URL(process.env.SITE_URL || 'https://mixmyboba.com'),
  title: {
    default: 'Mix My Boba — Craft Boba Tea Mixes | Make Boba at Home',
    template: '%s | Mix My Boba',
  },
  description: 'Craft-quality boba tea mixes made with whole-leaf tea, organic date sweetener, and functional adaptogens. Classic milk tea, taro, matcha, brown sugar — just add water and milk. Ready in under a minute.',
  keywords: ['boba tea', 'bubble tea', 'milk tea mix', 'instant boba', 'boba at home', 'taro milk tea', 'matcha latte', 'brown sugar boba', 'premix boba', 'tea latte powder', 'boba kit'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Mix My Boba',
    title: 'Mix My Boba — Craft Boba Tea Mixes',
    description: 'Boba shop taste at home. Craft-quality mixes with whole-leaf tea, date sweetener, and zero artificial flavors. Ready in under a minute.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mix My Boba — Craft Boba Tea Mixes',
    description: 'Boba shop taste at home. Whole-leaf tea mixes with adaptogens and prebiotics. Ready in under a minute.',
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
        <Footer />
      </body>
    </html>
  )
}
