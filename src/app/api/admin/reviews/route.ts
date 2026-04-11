import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { updateReviewSchema, deleteReviewSchema } from '@/lib/validations'
import { safeJson, isErrorResponse } from '@/lib/safe-json'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const productId = searchParams.get('productId')

  const where: Record<string, unknown> = {}
  if (productId) where.productId = productId

  const reviews = await prisma.review.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(reviews)
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body

  const parsed = deleteReviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  await prisma.review.delete({ where: { id: parsed.data.reviewId } })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body

  const parsed = updateReviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { reviewId, ...data } = parsed.data
  const review = await prisma.review.update({
    where: { id: reviewId },
    data,
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } },
    },
  })
  return NextResponse.json(review)
}
