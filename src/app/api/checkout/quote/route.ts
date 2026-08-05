import { NextRequest, NextResponse } from 'next/server'
import { buildQuote, type QuoteItemInput } from '@/lib/pricing-server'
import { rateLimit } from '@/lib/rate-limit'
import { safeJson, isErrorResponse } from '@/lib/safe-json'
import { quoteRequestSchema } from '@/lib/validations'

/**
 * Prices a cart without creating an order.
 *
 * The checkout page renders these numbers instead of computing its own, so the
 * total the customer approves is the same value `/api/orders` will charge.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const { success } = rateLimit(`quote:${ip}`, { limit: 60, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body

  const parsed = quoteRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const result = await buildQuote({
    items: parsed.data.items as QuoteItemInput[],
    couponCode: parsed.data.couponCode ?? null,
    email: parsed.data.email ?? null,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  // The per-product/per-variant quantity maps exist only for the order
  // transaction's stock decrement, so they're stripped from the client payload.
  const { lines, totals, coupon, couponError, stockIssues, currency } = result.quote
  return NextResponse.json({ lines, totals, coupon, couponError, stockIssues, currency })
}
