import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'
import { safeJson, isErrorResponse } from '@/lib/safe-json'

export async function POST(req: NextRequest) {
  // Rate limit: 5 registrations per minute per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const { success } = rateLimit(`register:${ip}`, { limit: 5, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many registration attempts. Please wait a minute.' }, { status: 429 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { email, password, name } = parsed.data
  const normalizedEmail = email.trim().toLowerCase()

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const hashed = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email: normalizedEmail, password: hashed, name: name?.trim() || null },
  })

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
