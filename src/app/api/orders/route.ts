import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createOrderSchema } from '@/lib/validations'
import { rateLimit, rateLimitCombo } from '@/lib/rate-limit'
import { safeJson, isErrorResponse } from '@/lib/safe-json'

export async function POST(req: NextRequest) {
  // Rate limit: 5 orders per minute per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const { success } = rateLimit(`order:${ip}`, { limit: 5, windowMs: 60_000 })
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body
  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { email, shippingAddress, paymentMethod, items, notes, couponCode } = parsed.data

  // Validate products exist and are active
  const productIds = items.map((i: { productId: string }) => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  })

  if (products.length !== items.length) {
    return NextResponse.json({ error: 'One or more products not found or inactive' }, { status: 400 })
  }

  // Validate stock availability
  const productMap = new Map(products.map(p => [p.id, p]))
  for (const item of items as Array<{ productId: string; quantity: number }>) {
    const product = productMap.get(item.productId)!
    if (item.quantity <= 0) {
      return NextResponse.json({ error: `Invalid quantity for ${product.name}` }, { status: 400 })
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for ${product.name}. Available: ${product.stock}` },
        { status: 400 }
      )
    }
  }

  // Calculate totals using current DB prices (not client-submitted prices)
  let subtotal = 0
  const orderItems = (items as Array<{ productId: string; quantity: number; variantLabel?: string }>).map(item => {
    const product = productMap.get(item.productId)!
    const price = product.price
    subtotal += price * item.quantity
    return {
      productId: item.productId,
      quantity: item.quantity,
      price,
      variantLabel: item.variantLabel || null,
    }
  })

  // Apply coupon if provided
  let discount = 0
  let appliedCoupon: string | null = null
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase().trim() } })
    if (coupon && coupon.active) {
      const notExpired = !coupon.expiresAt || new Date() <= coupon.expiresAt
      const hasUses = !coupon.maxUses || coupon.usedCount < coupon.maxUses
      if (notExpired && hasUses && subtotal >= coupon.minOrder) {
        discount = coupon.type === 'percent'
          ? subtotal * (coupon.value / 100)
          : Math.min(coupon.value, subtotal)
        discount = Math.round(discount * 100) / 100
        appliedCoupon = coupon.code
      }
    }
  }

  const user = await getCurrentUser()

  // Additional rate limit by authenticated user (prevents account-level abuse)
  if (user) {
    const combo = rateLimitCombo(ip, user.id, 'order', { ipLimit: 5, userLimit: 10, windowMs: 60_000 })
    if (!combo.success) {
      return NextResponse.json({ error: 'Too many orders. Please wait a minute.' }, { status: 429 })
    }
  }

  // Create order and decrement stock in a transaction
  try {
    const order = await prisma.$transaction(async (tx) => {
      // Decrement stock for each product
      for (const item of items as Array<{ productId: string; quantity: number }>) {
        const updated = await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
        if (updated.stock < 0) {
          throw new Error(`Insufficient stock for ${updated.name}`)
        }
      }

      // Increment coupon usage
      if (appliedCoupon) {
        await tx.coupon.update({
          where: { code: appliedCoupon },
          data: { usedCount: { increment: 1 } },
        })
      }

      return tx.order.create({
        data: {
          userId: user?.id || null,
          email: email.trim().toLowerCase(),
          shippingAddress: shippingAddress.trim(),
          paymentMethod: paymentMethod || 'crypto',
          subtotal,
          total: subtotal - discount,
          discount,
          couponCode: appliedCoupon,
          notes: notes?.trim() || null,
          items: { create: orderItems },
        },
        include: { items: { include: { product: true } } },
      })
    })

    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create order'
    // Stock-related errors are user-facing
    if (message.includes('Insufficient stock')) {
      return NextResponse.json({ error: message }, { status: 409 })
    }
    return NextResponse.json({ error: 'Order could not be processed. Please try again.' }, { status: 500 })
  }
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const where = user.role === 'admin' ? {} : { userId: user.id }
  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(orders)
}
