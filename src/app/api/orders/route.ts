import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createOrderSchema } from '@/lib/validations'
import { rateLimit, rateLimitCombo } from '@/lib/rate-limit'
import { safeJson, isErrorResponse } from '@/lib/safe-json'
import { emitWebhookEvent, getLowStockThreshold } from '@/lib/webhooks'
import { buildQuote, type QuoteItemInput } from '@/lib/pricing-server'

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

  const { email, shippingAddress, phone, paymentMethod, items, notes, couponCode } = parsed.data
  const normalisedEmail = email.trim().toLowerCase()

  // Cash on delivery needs a contactable number for the courier.
  if (paymentMethod === 'cod' && !phone?.trim()) {
    return NextResponse.json(
      { error: 'A phone number is required for cash on delivery orders' },
      { status: 400 }
    )
  }

  // Price the cart server-side. This is the same call the checkout page made to
  // render its summary, so the customer is charged exactly what was displayed.
  // `strictCoupon` makes an unusable code fail loudly rather than silently
  // repricing the order at full price.
  const quoted = await buildQuote({
    items: items as QuoteItemInput[],
    couponCode,
    email: normalisedEmail,
    strictCoupon: true,
  })

  if (!quoted.ok) {
    return NextResponse.json({ error: quoted.error }, { status: quoted.status })
  }

  const { lines, totals, coupon, stockIssues, productQuantities, variantQuantities } = quoted.quote

  if (stockIssues.length > 0) {
    const issue = stockIssues[0]
    return NextResponse.json(
      {
        error:
          issue.available > 0
            ? `Only ${issue.available} left of ${issue.name}. Please reduce the quantity.`
            : `${issue.name} just sold out.`,
      },
      { status: 409 }
    )
  }

  const user = await getCurrentUser()

  // Additional rate limit by authenticated user (prevents account-level abuse)
  if (user) {
    const combo = rateLimitCombo(ip, user.id, 'order', { ipLimit: 5, userLimit: 10, windowMs: 60_000 })
    if (!combo.success) {
      return NextResponse.json({ error: 'Too many orders. Please wait a minute.' }, { status: 429 })
    }
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Decrement product-level stock, guarding against a concurrent order that
      // drained the shelf between the quote and this transaction.
      for (const { productId, quantity } of productQuantities) {
        const updated = await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: quantity } },
        })
        if (updated.stock < 0) {
          throw new Error(`Insufficient stock for ${updated.name}`)
        }
      }

      // Decrement per-size stock as well, so variant inventory stays truthful.
      for (const { variantId, quantity } of variantQuantities) {
        const updated = await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: { decrement: quantity } },
        })
        if (updated.stock < 0) {
          throw new Error(`Insufficient stock for ${updated.label}`)
        }
      }

      if (coupon) {
        await tx.coupon.update({
          where: { code: coupon.code },
          data: { usedCount: { increment: 1 } },
        })
      }

      return tx.order.create({
        data: {
          userId: user?.id || null,
          email: normalisedEmail,
          phone: phone?.trim() || null,
          shippingAddress: shippingAddress.trim(),
          paymentMethod,
          subtotal: totals.subtotal,
          shipping: totals.shipping,
          tax: totals.tax,
          total: totals.total,
          discount: totals.discount,
          couponCode: coupon?.code ?? null,
          notes: notes?.trim() || null,
          items: {
            create: lines.map(line => ({
              productId: line.productId,
              quantity: line.quantity,
              price: line.unitPrice,
              basePrice: line.basePrice,
              variantId: line.variantId,
              variantLabel: line.variantLabel,
              purchaseType: line.purchaseType,
            })),
          },
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
      tax: order.tax,
      paymentMethod: order.paymentMethod,
      status: order.status,
      couponCode: order.couponCode,
      items: order.items.map(i => ({
        productId: i.productId,
        productName: i.product.name,
        quantity: i.quantity,
        price: i.price,
        basePrice: i.basePrice,
        variantId: i.variantId,
        variantLabel: i.variantLabel,
        purchaseType: i.purchaseType,
      })),
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt.toISOString(),
    })

    // 🔔 Webhook: check for low stock / out of stock after order
    const threshold = getLowStockThreshold()
    for (const { productId } of productQuantities) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
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
