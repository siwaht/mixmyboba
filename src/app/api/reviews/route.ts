import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createReviewSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'
import { safeJson, isErrorResponse } from '@/lib/safe-json'
import { emitWebhookEvent } from '@/lib/webhooks'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Sign in to leave a review' }, { status: 401 })
  }

  // Rate limit: 5 reviews per minute per user
  const { success } = rateLimit(`review:${user.id}`, { limit: 5, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body
  const parsed = createReviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { productId, rating, title, body: reviewBody, displayName } = parsed.data

  // Check if user already reviewed this product
  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId: user.id } },
  })
  if (existing) {
    return NextResponse.json({ error: 'You already reviewed this product' }, { status: 409 })
  }

  // Check if user has purchased this product (verified review)
  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId: user.id, status: { in: ['paid', 'shipped', 'delivered'] } },
    },
  })

  const review = await prisma.review.create({
    data: {
      productId,
      userId: user.id,
      rating,
      title: title.trim(),
      body: reviewBody.trim(),
      displayName: displayName?.trim() || null,
      verified: !!purchased,
    },
    include: { user: { select: { name: true, role: true } } },
  })

  // Revalidate the product page so review stats are fresh
  const { revalidatePath } = await import('next/cache')
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true, name: true } })
  if (product) {
    revalidatePath(`/product/${product.slug}`)
  }

  // 🔔 Webhook: new review created
  emitWebhookEvent('review.created', {
    reviewId: review.id,
    productId,
    productName: product?.name || 'Unknown',
    rating,
    title: review.title,
    body: review.body,
    verified: review.verified,
    displayName: review.displayName || review.user?.name || 'Anonymous',
    userId: user.id,
    createdAt: review.createdAt.toISOString(),
  })

  return NextResponse.json(review, { status: 201 })
}
