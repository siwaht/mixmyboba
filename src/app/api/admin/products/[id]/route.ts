import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { updateProductSchema } from '@/lib/validations'
import { safeJson, isErrorResponse } from '@/lib/safe-json'
import { emitWebhookEvent } from '@/lib/webhooks'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { price: 'asc' } },
      coas: { orderBy: { testDate: 'desc' } },
      reviews: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  return NextResponse.json(product)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { id } = await params
  const body = await safeJson(req)
  if (isErrorResponse(body)) return body

  const parsed = updateProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const before = await prisma.product.findUnique({ where: { id }, select: { stock: true, price: true, active: true, name: true } })
  if (!before) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const product = await prisma.product.update({
    where: { id },
    data: parsed.data,
    include: { variants: { orderBy: { price: 'asc' } } },
  })

  // 🔔 Webhook: product updated
  emitWebhookEvent('product.updated', {
    productId: product.id,
    productName: product.name,
    slug: product.slug,
    changes: parsed.data,
    previousValues: { stock: before.stock, price: before.price, active: before.active },
    currentStock: product.stock,
    currentPrice: product.price,
    active: product.active,
    updatedAt: product.updatedAt.toISOString(),
  })

  return NextResponse.json(product)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true },
  })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // OrderItem intentionally has no cascade on its product relation, so deleting
  // a sold product would either fail at the database or destroy order history.
  // Deactivating hides it from the storefront while keeping past orders intact.
  const soldCount = await prisma.orderItem.count({ where: { productId: id } })
  if (soldCount > 0) {
    return NextResponse.json(
      {
        error: `${product.name} appears in ${soldCount} order line${soldCount === 1 ? '' : 's'} and can't be deleted. Deactivate it instead to hide it from the store.`,
      },
      { status: 409 }
    )
  }

  await prisma.product.delete({ where: { id } })

  emitWebhookEvent('product.deleted', {
    productId: product.id,
    productName: product.name,
    slug: product.slug,
    deletedAt: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}
