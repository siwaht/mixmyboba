import { NextRequest, NextResponse } from 'next/server'
import { getJwtSecret } from '@/lib/jwt-secret'

/**
 * Verifies a JWT token using Web Crypto API (Edge-compatible).
 */
async function verifyJwtEdge(token: string, secret: string): Promise<{ userId: string; role: string } | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.')
    if (!headerB64 || !payloadB64 || !signatureB64) return null

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const signatureBytes = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    )
    const dataBytes = encoder.encode(`${headerB64}.${payloadB64}`)
    const valid = await crypto.subtle.verify('HMAC', key, signatureBytes, dataBytes)
    if (!valid) return null

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp && Date.now() >= payload.exp * 1000) return null

    return payload as { userId: string; role: string }
  } catch {
    return null
  }
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Decides whether a state-changing API request may proceed.
 *
 * Origin is the primary signal: a cross-site page can trigger a request but
 * cannot forge `Origin` or `Sec-Fetch-Site`. The Content-Type heuristic is kept
 * only as a fallback for non-browser clients that send neither header — on its
 * own it rejected every bodyless `DELETE`, which silently broke the admin
 * delete actions.
 */
function isTrustedMutation(request: NextRequest): boolean {
  // API consumers (MCP tooling, scripts) authenticate with a Bearer token,
  // which a cross-site page cannot attach to a forged request.
  if (request.headers.has('authorization')) return true

  // Browsers set Sec-Fetch-Site on every request and scripts cannot override it.
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite) return fetchSite === 'same-origin' || fetchSite === 'none'

  // Older browsers: compare Origin against the host actually being served.
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      const originHost = new URL(origin).host
      const targetHost = request.headers.get('x-forwarded-host') || request.headers.get('host')
      return Boolean(targetHost) && originHost === targetHost
    } catch {
      return false
    }
  }

  // No browser fetch metadata at all — fall back to the previous rule.
  const contentType = request.headers.get('content-type') || ''
  return contentType.includes('application/json') || contentType.includes('multipart/form-data')
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── CSRF protection for mutating API requests ──
  if (pathname.startsWith('/api/') && MUTATING_METHODS.has(request.method)) {
    if (!isTrustedMutation(request)) {
      return NextResponse.json(
        { error: 'Request blocked: it did not originate from this site.' },
        { status: 403 }
      )
    }
  }

  // ── Admin route protection ──
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      const loginUrl = new URL('/account', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const payload = await verifyJwtEdge(token, getJwtSecret())
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/account', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
