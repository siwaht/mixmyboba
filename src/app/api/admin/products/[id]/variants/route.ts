import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { safeJson, isErrorResponse } from '@/lib/safe-json'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

// List variants for a product
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  const { id } = await params
  const variants = await prisma.productVariant.findMany({
    where: { productId: id },
    orderBy: { price: 'asc' },
  })
  return NextResponse.json(variants)
}

// Create a variant
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  const { id } = await params
  const data = await safeJson<Record<string, unknown>>(req)
  if (isErrorResponse(data)) return data

  if (!data.label || data.price === undefined) {
    return NextResponse.json({ error: 'label and price are required' }, { status: 400 })
  }

  const variant = await prisma.productVariant.create({
    data: {
      productId: id,
      label: String(data.label),
      price: parseFloat(String(data.price)),
      stock: parseInt(String(data.stock ?? '100')) || 100,
      active: data.active !== false,
    },
  })
  return NextResponse.json(variant, { status: 201 })
}

// Update a variant
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  const data = await safeJson<Record<string, unknown>>(req)
  if (isErrorResponse(data)) return data
  if (!data.variantId) {
    return NextResponse.json({ error: 'variantId is required' }, { status: 400 })
  }
  const { variantId, ...updateData } = data
  const update: Record<string, unknown> = { ...updateData }
  if (update.price !== undefined) update.price = parseFloat(String(update.price))
  if (update.stock !== undefined) update.stock = parseInt(String(update.stock))

  const variant = await prisma.productVariant.update({
    where: { id: String(variantId) },
    data: update,
  })
  return NextResponse.json(variant)
}

// Delete a variant
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  const body = await safeJson(req)
  if (isErrorResponse(body)) return body
  const { variantId } = body as { variantId: string }
  if (!variantId) {
    return NextResponse.json({ error: 'variantId is required' }, { status: 400 })
  }
  await prisma.productVariant.delete({ where: { id: variantId } })
  return NextResponse.json({ success: true })
}
