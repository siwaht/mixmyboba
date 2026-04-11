import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const products = await prisma.product.findMany({
    orderBy: { stock: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      stock: true,
      active: true,
      category: true,
      price: true,
      orderItems: {
        select: { quantity: true },
      },
    },
  })

  const inventory = products.map(p => ({
    ...p,
    totalSold: p.orderItems.reduce((sum, oi) => sum + oi.quantity, 0),
    orderItems: undefined,
  }))

  return NextResponse.json(inventory)
}
