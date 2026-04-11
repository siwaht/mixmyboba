import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  // Get all products with tags
  const products = await prisma.product.findMany({
    where: { tag: { not: null } },
    select: { id: true, tag: true, name: true },
  })

  // Get order items for tagged products
  const orderItems = await prisma.orderItem.findMany({
    where: { productId: { in: products.map(p => p.id) } },
    select: { productId: true, quantity: true, price: true },
  })

  // Build analytics per tag
  const tagStats: Record<string, { tag: string; productCount: number; totalSold: number; totalRevenue: number; products: string[] }> = {}

  for (const p of products) {
    const tag = p.tag!
    if (!tagStats[tag]) {
      tagStats[tag] = { tag, productCount: 0, totalSold: 0, totalRevenue: 0, products: [] }
    }
    tagStats[tag].productCount++
    tagStats[tag].products.push(p.name)

    const items = orderItems.filter(oi => oi.productId === p.id)
    for (const item of items) {
      tagStats[tag].totalSold += item.quantity
      tagStats[tag].totalRevenue += item.price * item.quantity
    }
  }

  const analytics = Object.values(tagStats).sort((a, b) => b.totalRevenue - a.totalRevenue)

  return NextResponse.json({
    totalTaggedProducts: products.length,
    tagBreakdown: analytics,
  })
}
