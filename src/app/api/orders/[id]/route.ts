import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { safeJson, isErrorResponse } from '@/lib/safe-json'
import { emitWebhookEvent } from '@/lib/webhooks'

export async function GET(
  _req: NextRequest,
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

  if (user?.role !== 'admin' && order.userId !== user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
  const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const existing = await prisma.order.findUnique({ where: { id }, select: { status: true, email: true } })
  if (!existing) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const oldStatus = existing.status

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: { items: { include: { product: true } } },
  })

  // 🔔 Webhook: order status changed
  if (oldStatus !== status) {
    emitWebhookEvent('order.status_changed', {
      orderId: order.id,
      email: order.email,
      oldStatus,
      newStatus: status,
      total: order.total,
      paymentMethod: order.paymentMethod,
      items: order.items.map(i => ({
        productName: i.product.name,
        quantity: i.quantity,
        price: i.price,
      })),
      updatedAt: order.updatedAt.toISOString(),
    })
  }

  return NextResponse.json(order)
}
