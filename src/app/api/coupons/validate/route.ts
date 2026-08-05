import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { safeJson, isErrorResponse } from '@/lib/safe-json'
import { evaluateCoupon } from '@/lib/pricing'

/**
 * Previews a coupon against a caller-supplied subtotal.
 *
 * This is a convenience/preview endpoint only — the discount that actually gets
 * charged is recomputed by `buildQuote` from database prices at order time,
 * using the same `evaluateCoupon` rules so the two can never disagree.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success } = rateLimit(`coupon:${ip}`, { limit: 15, windowMs: 60_000 })
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })
    }

    const body = await safeJson(req)
    if (isErrorResponse(body)) return body
    const { code, subtotal = 0, email } = body as { code?: string; subtotal?: number; email?: string }

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Coupon code required' }, { status: 400 })
    }
    if (typeof subtotal !== 'number' || !Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json({ error: 'Invalid subtotal' }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    })

    const normalisedEmail = email?.toLowerCase().trim() || ''
    let priorCustomerUses = 0
    if (coupon?.maxUsesPerCustomer != null && normalisedEmail) {
      priorCustomerUses = await prisma.order.count({
        where: {
          email: normalisedEmail,
          couponCode: coupon.code,
          status: { not: 'cancelled' },
        },
      })
    }

    const result = evaluateCoupon(coupon, {
      subtotal,
      priorCustomerUses,
      hasEmail: Boolean(normalisedEmail),
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({
      code: result.code,
      type: result.type,
      value: result.value,
      discount: result.discount,
    })
  } catch (err) {
    console.error('Coupon validation error:', err)
    return NextResponse.json(
      { error: 'Failed to validate coupon. Please try again.' },
      { status: 500 }
    )
  }
}
