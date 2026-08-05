import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { safeJson, isErrorResponse } from '@/lib/safe-json'
import { emitWebhookEvent } from '@/lib/webhooks'
import { adminCreateOrderSchema } from '@/lib/validations'
import { getPricingConfig } from '@/lib/pricing-server'
import { money } from '@/lib/pricing'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

/**
 * Records an order the shop took outside the storefront — phone, wholesale, or a
 * replacement shipment. Unlike the customer flow this trusts the admin's price
 * and shipping overrides, but it still moves stock so inventory stays truthful.
 */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body

  const parsed = adminCreateOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { email, shippingAddress, phone, paymentMethod, status, items, notes, discount, shipping } = parsed.data

  const productIds = [...new Set(items.map(i => i.productId))]
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  })
  const productMap = new Map(products.map(p => [p.id, p]))

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: 'One or more products could not be found' }, { status: 400 })
  }

  let subtotal = 0
  const orderItems: {
    productId: string
    quantity: number
    price: number
    basePrice: number
    variantId: string | null
    variantLabel: string | null
    purchaseType: string
  }[] = []
  const productQty = new Map<string, number>()
  const variantQty = new Map<string, number>()

  for (const item of items) {
    const product = productMap.get(item.productId)!
    const variant = item.variantId
      ? product.variants.find(v => v.id === item.variantId) ?? null
      : null

    if (item.variantId && !variant) {
      return NextResponse.json(
        { error: `The selected size for ${product.name} could not be found` },
        { status: 400 }
      )
    }

    const basePrice = money(variant ? variant.price : product.price)
    const price = money(item.price ?? basePrice)
    subtotal += price * item.quantity

    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      price,
      basePrice,
      variantId: variant?.id ?? null,
      variantLabel: variant?.label ?? null,
      purchaseType: 'onetime',
    })

    productQty.set(item.productId, (productQty.get(item.productId) ?? 0) + item.quantity)
    if (variant) {
      variantQty.set(variant.id, (variantQty.get(variant.id) ?? 0) + item.quantity)
    }
  }

  // Stock only moves for orders that will actually ship.
  const movesStock = status !== 'cancelled'
  if (movesStock) {
    for (const [productId, quantity] of productQty) {
      const product = productMap.get(productId)!
      if (product.stock < quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}` },
          { status: 409 }
        )
      }
    }
    for (const [variantId, quantity] of variantQty) {
      const variant = products.flatMap(p => p.variants).find(v => v.id === variantId)!
      if (variant.stock < quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for size ${variant.label}. Available: ${variant.stock}` },
          { status: 409 }
        )
      }
    }
  }

  subtotal = money(subtotal)
  const appliedDiscount = money(Math.min(discount, subtotal))
  const config = await getPricingConfig()
  const tax = money((subtotal - appliedDiscount) * (config.taxRate / 100))
  const total = money(subtotal - appliedDiscount + shipping + tax)

  const normalisedEmail = email.toLowerCase().trim()
  const customer = await prisma.user.findUnique({ where: { email: normalisedEmail } })

  const order = await prisma.$transaction(async (tx) => {
    if (movesStock) {
      for (const [productId, quantity] of productQty) {
        const updated = await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: quantity } },
        })
        if (updated.stock < 0) throw new Error(`Insufficient stock for ${updated.name}`)
      }
      for (const [variantId, quantity] of variantQty) {
        const updated = await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: { decrement: quantity } },
        })
        if (updated.stock < 0) throw new Error(`Insufficient stock for ${updated.label}`)
      }
    }

    return tx.order.create({
      data: {
        userId: customer?.id || null,
        email: normalisedEmail,
        phone: phone?.trim() || null,
        shippingAddress: shippingAddress.trim(),
        paymentMethod,
        status,
        subtotal,
        shipping: money(shipping),
        tax,
        total,
        discount: appliedDiscount,
        notes: notes?.trim() || null,
        // A cancelled order never took stock, so there is nothing to give back.
        stockRestored: !movesStock,
        items: { create: orderItems },
      },
      include: { items: { include: { product: true } } },
    })
  }).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('Insufficient stock')) {
      return NextResponse.json({ error: message }, { status: 409 })
    }
    console.error('Admin order creation error:', err)
    return NextResponse.json({ error: 'Order could not be created. Please try again.' }, { status: 500 })
  })

  if (order instanceof NextResponse) return order

  // 🔔 Webhook: order created (admin-created)
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
    items: order.items.map(i => ({
      productId: i.productId,
      productName: i.product.name,
      quantity: i.quantity,
      price: i.price,
      basePrice: i.basePrice,
      variantId: i.variantId,
      variantLabel: i.variantLabel,
    })),
    shippingAddress: order.shippingAddress,
    source: 'admin',
    createdAt: order.createdAt.toISOString(),
  })

  return NextResponse.json(order, { status: 201 })
}
