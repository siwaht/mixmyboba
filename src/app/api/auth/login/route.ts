import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, signToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'
import { safeJson, isErrorResponse } from '@/lib/safe-json'

export async function POST(req: NextRequest) {
  // Rate limit: 10 attempts per minute per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const { success } = rateLimit(`login:${ip}`, { limit: 10, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many login attempts. Please wait a minute.' }, { status: 429 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { email, password } = parsed.data
  const normalizedEmail = email.trim().toLowerCase()

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (!user || !(await verifyPassword(password, user.password))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = signToken({ userId: user.id, role: user.role })

  const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  res.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return res
}
