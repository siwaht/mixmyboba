import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { safeJson, isErrorResponse } from '@/lib/safe-json'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const { success } = rateLimit(`coupon:${ip}`, { limit: 15, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body
  const { code, subtotal } = body as { code: string; subtotal: number }

  if (!code) {
    return NextResponse.json({ error: 'Coupon code required' }, { status: 400 })
  }

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } })

  if (!coupon || !coupon.active) {
    return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 })
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return NextResponse.json({ error: 'Coupon has expired' }, { status: 410 })
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 410 })
  }

  if (subtotal < coupon.minOrder) {
    return NextResponse.json(
      { error: `Minimum order of $${coupon.minOrder.toFixed(2)} required` },
      { status: 400 }
    )
  }

  const discount = coupon.type === 'percent'
    ? subtotal * (coupon.value / 100)
    : Math.min(coupon.value, subtotal)

  return NextResponse.json({
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount: Math.round(discount * 100) / 100,
  })
}
