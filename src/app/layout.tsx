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
    default: 'Mix My Boba — Premium Bubble Tea Mixes | Make Boba at Home',
    template: '%s | Mix My Boba',
  },
  description: 'Premium superfood boba tea mixes made with real tea and natural ingredients. Classic milk tea, taro, matcha, brown sugar — just add water and your favorite milk. Ready in 60 seconds. Shop now at mixmyboba.com.',
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
        <Footer />
      </body>
    </html>
  )
}
