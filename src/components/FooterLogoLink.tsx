'use client'

import Link from 'next/link'

interface Props {
  logoEmoji: string
  logoFirst: string
  logoMiddle: string
  logoLast: string
}

export default function FooterLogoLink({ logoEmoji, logoFirst, logoMiddle, logoLast }: Props) {
  return (
    <Link
      href="/"
      className="logo footer-logo"
      aria-label="Homepage"
      onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
    >
      <span className="logo-emoji">{logoEmoji}</span>{' '}
      <span>{logoFirst}{logoMiddle ? ` ${logoMiddle}` : ''}</span>{logoLast ? ` ${logoLast}` : ''}
    </Link>
  )
}
