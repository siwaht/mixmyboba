import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createOrderSchema } from '@/lib/validations'
import { rateLimit, rateLimitCombo } from '@/lib/rate-limit'
import { safeJson, isErrorResponse } from '@/lib/safe-json'
import { emitWebhookEvent, getLowStockThreshold } from '@/lib/webhooks'

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

  const { email, shippingAddress, phone, paymentMethod, items, notes, couponCode, shipping: clientShipping } = parsed.data

  // Validate products exist and are active
  // Deduplicate product IDs since multiple variants of the same product share one ID
  const productIds = [...new Set(items.map((i: { productId: string }) => i.productId))]
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  })

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: 'One or more products not found or inactive' }, { status: 400 })
  }

  // Validate stock availability (aggregate quantities per product)
  const productMap = new Map(products.map(p => [p.id, p]))
  const aggregatedQty = new Map<string, number>()
  for (const item of items as Array<{ productId: string; quantity: number }>) {
    const product = productMap.get(item.productId)
    if (!product) {
      return NextResponse.json({ error: 'One or more products not found or inactive' }, { status: 400 })
    }
    if (item.quantity <= 0) {
      return NextResponse.json({ error: `Invalid quantity for ${product.name}` }, { status: 400 })
    }
    aggregatedQty.set(item.productId, (aggregatedQty.get(item.productId) || 0) + item.quantity)
  }
  for (const [pid, totalQty] of aggregatedQty) {
    const product = productMap.get(pid)!
    if (product.stock < totalQty) {
      return NextResponse.json(
        { error: `Insufficient stock for ${product.name}. Available: ${product.stock}` },
        { status: 400 }
      )
    }
  }

  // Calculate totals using current DB prices (not client-submitted prices)
  // When a variantLabel is provided, look up the variant's price from the DB
  const variantsByProduct = new Map<string, Array<{ label: string; price: number }>>()
  if (items.some((i: { variantLabel?: string }) => i.variantLabel)) {
    const variants = await prisma.productVariant.findMany({
      where: { productId: { in: productIds }, active: true },
      select: { productId: true, label: true, price: true },
    })
    for (const v of variants) {
      const list = variantsByProduct.get(v.productId) || []
      list.push({ label: v.label, price: v.price })
      variantsByProduct.set(v.productId, list)
    }
  }

  let subtotal = 0
  const orderItems = (items as Array<{ productId: string; quantity: number; variantLabel?: string }>).map(item => {
    const product = productMap.get(item.productId)!
    let price = product.price
    // Use variant-specific price if a variant label was provided
    if (item.variantLabel) {
      const variants = variantsByProduct.get(item.productId)
      const matchedVariant = variants?.find(v => v.label === item.variantLabel)
      if (matchedVariant) {
        price = matchedVariant.price
      }
    }
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
      // Decrement stock for each product (aggregate quantities per product)
      for (const [pid, totalQty] of aggregatedQty) {
        const updated = await tx.product.update({
          where: { id: pid },
          data: { stock: { decrement: totalQty } },
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
          phone: phone?.trim() || null,
          shippingAddress: shippingAddress.trim(),
          paymentMethod: paymentMethod || 'crypto',
          subtotal,
          shipping: subtotal >= 50 ? 0 : 5.99,
          total: Math.max(0, subtotal - discount + (subtotal >= 50 ? 0 : 5.99)),
          discount,
          couponCode: appliedCoupon,
          notes: notes?.trim() || null,
          items: { create: orderItems },
        },
        include: { items: { include: { product: true } } },
      })
    })

    // 🔔 Webhook: order created
    emitWebhookEvent('order.created', {
      orderId: order.id,
      email: order.email,
      total: order.total,
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: order.shipping,
      paymentMethod: order.paymentMethod,
      status: order.status,
      couponCode: order.couponCode,
      items: order.items.map(i => ({
        productId: i.productId,
        productName: i.product.name,
        quantity: i.quantity,
        price: i.price,
        variantLabel: i.variantLabel,
      })),
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt.toISOString(),
    })

    // 🔔 Webhook: check for low stock / out of stock after order
    const threshold = getLowStockThreshold()
    for (const [pid] of aggregatedQty) {
      const product = await prisma.product.findUnique({
        where: { id: pid },
        select: { id: true, name: true, slug: true, stock: true, category: true },
      })
      if (product) {
        if (product.stock <= 0) {
          emitWebhookEvent('inventory.out_of_stock', {
            productId: product.id,
            productName: product.name,
            slug: product.slug,
            stock: product.stock,
            category: product.category,
          })
        } else if (product.stock <= threshold) {
          emitWebhookEvent('inventory.low_stock', {
            productId: product.id,
            productName: product.name,
            slug: product.slug,
            stock: product.stock,
            threshold,
            category: product.category,
          })
        }
      }
    }

    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create order'
    console.error('Order creation error:', err)
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
