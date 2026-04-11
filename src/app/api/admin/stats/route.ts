import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const [totalProducts, totalOrders, totalUsers, orders, lowStockProducts] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where: { stock: { lt: 20 } } }),
  ])

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const paidOrders = orders.filter(o => o.status === 'paid').length
  const shippedOrders = orders.filter(o => o.status === 'shipped').length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length

  // Revenue by status
  const paidRevenue = orders
    .filter(o => ['paid', 'shipped', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + o.total, 0)

  // Recent orders (last 10)
  const recentOrders = orders.slice(0, 10).map(o => ({
    id: o.id,
    email: o.email,
    status: o.status,
    total: o.total,
    paymentMethod: o.paymentMethod,
    createdAt: o.createdAt,
    items: o.items.map(i => ({ product: { name: i.product.name }, quantity: i.quantity })),
  }))

  // Top products by revenue
  const productRevenue: Record<string, { name: string; revenue: number; sold: number }> = {}
  for (const order of orders) {
    if (order.status === 'cancelled') continue
    for (const item of order.items) {
      const key = item.productId
      if (!productRevenue[key]) {
        productRevenue[key] = { name: item.product.name, revenue: 0, sold: 0 }
      }
      productRevenue[key].revenue += item.price * item.quantity
      productRevenue[key].sold += item.quantity
    }
  }
  const topProducts = Object.values(productRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return NextResponse.json({
    totalProducts,
    totalOrders,
    totalUsers,
    totalRevenue,
    paidRevenue,
    lowStockProducts,
    pendingOrders,
    paidOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    recentOrders,
    topProducts,
  })
}
