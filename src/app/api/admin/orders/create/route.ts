import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { safeJson, isErrorResponse } from '@/lib/safe-json'
import { emitWebhookEvent } from '@/lib/webhooks'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body
  const { email, shippingAddress, paymentMethod, status, items, notes, discount } = body as {
    email: string
    shippingAddress: string
    paymentMethod?: string
    status?: string
    items: Array<{ productId: string; quantity: number; price?: number; variantLabel?: string }>
    notes?: string
    discount?: string
  }

  if (!email || !shippingAddress || !items?.length) {
    return NextResponse.json({ error: 'Email, shipping address, and at least one item are required' }, { status: 400 })
  }

  // Validate products
  const productIds = items.map((i: { productId: string }) => i.productId)
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } })
  const productMap = new Map(products.map(p => [p.id, p]))

  let subtotal = 0
  const orderItems: { productId: string; quantity: number; price: number; variantLabel: string | null }[] = []

  for (const item of items as Array<{ productId: string; quantity: number; price?: number; variantLabel?: string }>) {
    const product = productMap.get(item.productId)
    if (!product) {
      return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
    }
    const price = item.price ?? product.price
    subtotal += price * item.quantity
    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      price,
      variantLabel: item.variantLabel || null,
    })
  }

  const discountAmount = parseFloat(discount || '0') || 0
  const total = Math.max(0, subtotal - discountAmount)

  // Look up user by email
  const customer = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

  const order = await prisma.order.create({
    data: {
      userId: customer?.id || null,
      email: email.toLowerCase().trim(),
      shippingAddress: shippingAddress.trim(),
      paymentMethod: paymentMethod || 'card',
      status: status || 'pending',
      subtotal,
      total,
      discount: discountAmount,
      notes: notes?.trim() || null,
      items: { create: orderItems },
    },
    include: { items: { include: { product: true } } },
  })

  // 🔔 Webhook: order created (admin-created)
  emitWebhookEvent('order.created', {
    orderId: order.id,
    email: order.email,
    total: order.total,
    subtotal: order.subtotal,
    discount: order.discount,
    paymentMethod: order.paymentMethod,
    status: order.status,
    items: order.items.map(i => ({
      productId: i.productId,
      productName: i.product.name,
      quantity: i.quantity,
      price: i.price,
      variantLabel: i.variantLabel,
    })),
    shippingAddress: order.shippingAddress,
    source: 'admin',
    createdAt: order.createdAt.toISOString(),
  })

  return NextResponse.json(order, { status: 201 })
}
