import { NextRequest, NextResponse } from 'next/server'
import { authCookieOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true })
  res.cookies.set('auth-token', '', { ...authCookieOptions(req), maxAge: 0 })
  return res
}
