import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createCouponSchema } from '@/lib/validations'
import { safeJson, isErrorResponse } from '@/lib/safe-json'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(coupons)
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body

  const parsed = createCouponSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { code, type, value, minOrder, maxUses, maxUsesPerCustomer, expiresAt } = parsed.data
  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase().trim(),
      type,
      value,
      minOrder,
      maxUses: maxUses ?? null,
      maxUsesPerCustomer: maxUsesPerCustomer ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      active: true,
    },
  })
  return NextResponse.json(coupon, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body

  const { id, ...data } = body as { id: string; [key: string]: unknown }
  if (!id) {
    return NextResponse.json({ error: 'Coupon id is required' }, { status: 400 })
  }

  const coupon = await prisma.coupon.update({ where: { id }, data })
  return NextResponse.json(coupon)
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body

  const { id } = body as { id: string }
  if (!id) {
    return NextResponse.json({ error: 'Coupon id is required' }, { status: 400 })
  }

  await prisma.coupon.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
