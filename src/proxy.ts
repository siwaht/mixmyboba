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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── CSRF protection for mutating API requests ──
  // Reject state-changing requests to /api/* that don't include a
  // Content-Type header (simple form POSTs from cross-origin won't have one
  // that matches). Allows JSON, multipart (file uploads), and Bearer-token
  // requests (MCP/API consumers).
  if (pathname.startsWith('/api/') && MUTATING_METHODS.has(request.method)) {
    const contentType = request.headers.get('content-type') || ''
    const hasAuth = request.headers.has('authorization')
    const isJson = contentType.includes('application/json')
    const isMultipart = contentType.includes('multipart/form-data')

    if (!isJson && !isMultipart && !hasAuth) {
      return NextResponse.json(
        { error: 'Invalid request. Missing Content-Type header.' },
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
