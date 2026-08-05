import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { safeJson, isErrorResponse } from '@/lib/safe-json'
import { emitWebhookEvent } from '@/lib/webhooks'
import { rateLimit } from '@/lib/rate-limit'

const VALID_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const isAdmin = user?.role === 'admin'
  const isOwner = Boolean(user && order.userId && order.userId === user.id)

  // Guest orders have no owning account. Let a guest retrieve their own order by
  // presenting the (unguessable) order id together with the email they ordered
  // with — rate limited so the pair can't be brute forced.
  let isGuestWithMatchingEmail = false
  if (!isAdmin && !isOwner) {
    const claimedEmail = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()
    if (claimedEmail) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      const { success } = rateLimit(`order-lookup:${ip}`, { limit: 20, windowMs: 60_000 })
      if (!success) {
        return NextResponse.json({ error: 'Too many lookups. Please wait a minute.' }, { status: 429 })
      }
      isGuestWithMatchingEmail = claimedEmail === order.email.toLowerCase()
    }
  }

  if (!isAdmin && !isOwner && !isGuestWithMatchingEmail) {
    // No credentials at all is unauthorized; credentials that simply don't match
    // this order is forbidden.
    const presentedSomething = Boolean(user) || req.nextUrl.searchParams.has('email')
    return presentedSomething
      ? NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(order)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body
  const { status } = body as { status: string }
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const existing = await prisma.order.findUnique({
    where: { id },
    select: { status: true, stockRestored: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const oldStatus = existing.status
  if (oldStatus === status) {
    const unchanged = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    })
    return NextResponse.json(unchanged)
  }

  // Cancelling puts the goods back on the shelf. `stockRestored` guards against
  // a second restock if the order is cancelled, reopened, and cancelled again.
  const shouldRestoreStock = status === 'cancelled' && !existing.stockRestored

  const order = await prisma.$transaction(async (tx) => {
    if (shouldRestoreStock) {
      const items = await tx.orderItem.findMany({
        where: { orderId: id },
        select: { productId: true, variantId: true, quantity: true },
      })

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
        if (item.variantId) {
          // The variant may have been deleted since the order was placed.
          await tx.productVariant.updateMany({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          })
        }
      }

      // Free the coupon redemption back up as well.
      const cancelled = await tx.order.findUnique({
        where: { id },
        select: { couponCode: true },
      })
      if (cancelled?.couponCode) {
        await tx.coupon.updateMany({
          where: { code: cancelled.couponCode, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        })
      }
    }

    return tx.order.update({
      where: { id },
      data: {
        status,
        ...(shouldRestoreStock ? { stockRestored: true } : {}),
      },
      include: { items: { include: { product: true } } },
    })
  })

  // 🔔 Webhook: order status changed
  emitWebhookEvent('order.status_changed', {
    orderId: order.id,
    email: order.email,
    oldStatus,
    newStatus: status,
    total: order.total,
    paymentMethod: order.paymentMethod,
    stockRestored: shouldRestoreStock,
    items: order.items.map(i => ({
      productName: i.product.name,
      quantity: i.quantity,
      price: i.price,
    })),
    updatedAt: order.updatedAt.toISOString(),
  })

  if (status === 'cancelled') {
    emitWebhookEvent('order.cancelled', {
      orderId: order.id,
      email: order.email,
      total: order.total,
      stockRestored: shouldRestoreStock,
      cancelledAt: order.updatedAt.toISOString(),
    })
  }

  return NextResponse.json(order)
}
