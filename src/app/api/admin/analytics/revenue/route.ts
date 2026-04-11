import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/admin/analytics/revenue?period=30d&groupBy=day
// Dedicated revenue analytics: trends, categories, AOV, repeat rate
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const url = new URL(req.url)
  const period = url.searchParams.get('period') || '30d'
  const groupBy = url.searchParams.get('groupBy') || 'day' // day | week | month

  let days = 30
  if (period.endsWith('d')) days = parseInt(period) || 30
  else if (period.endsWith('w')) days = (parseInt(period) || 4) * 7
  else if (period === 'all') days = 3650
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const allOrders = await prisma.order.findMany({
    include: {
      items: { include: { product: { select: { name: true, slug: true, category: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const periodOrders = allOrders.filter(o => o.createdAt >= since)
  const active = periodOrders.filter(o => o.status !== 'cancelled')
  const confirmed = periodOrders.filter(o => ['paid', 'shipped', 'delivered'].includes(o.status))

  // ─── Revenue grouped by day/week/month ───
  const revenueByGroup: Record<string, { revenue: number; orders: number }> = {}
  for (const o of active) {
    const d = o.createdAt
    let key: string
    if (groupBy === 'week') {
      const startOfWeek = new Date(d)
      startOfWeek.setDate(d.getDate() - d.getDay())
      key = startOfWeek.toISOString().split('T')[0]
    } else if (groupBy === 'month') {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    } else {
      key = d.toISOString().split('T')[0]
    }
    if (!revenueByGroup[key]) revenueByGroup[key] = { revenue: 0, orders: 0 }
    revenueByGroup[key].revenue += o.total
    revenueByGroup[key].orders++
  }

  // Sort chronologically
  const revenueTrend = Object.entries(revenueByGroup)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
    }))

  // ─── Revenue by category ───
  const catMap: Record<string, { revenue: number; units: number; orders: Set<string> }> = {}
  for (const o of active) {
    for (const item of o.items) {
      const cat = item.product.category
      if (!catMap[cat]) catMap[cat] = { revenue: 0, units: 0, orders: new Set() }
      catMap[cat].revenue += item.price * item.quantity
      catMap[cat].units += item.quantity
      catMap[cat].orders.add(o.id)
    }
  }
  const revenueByCategory = Object.entries(catMap)
    .map(([category, d]) => ({
      category,
      revenue: Math.round(d.revenue * 100) / 100,
      unitsSold: d.units,
      orderCount: d.orders.size,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  // ─── Revenue by payment method ───
  const pmMap: Record<string, { revenue: number; count: number }> = {}
  for (const o of active) {
    if (!pmMap[o.paymentMethod]) pmMap[o.paymentMethod] = { revenue: 0, count: 0 }
    pmMap[o.paymentMethod].revenue += o.total
    pmMap[o.paymentMethod].count++
  }
  const revenueByPaymentMethod = Object.entries(pmMap)
    .map(([method, d]) => ({
      method,
      revenue: Math.round(d.revenue * 100) / 100,
      orderCount: d.count,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  // ─── AOV ───
  const totalRevenue = active.reduce((s, o) => s + o.total, 0)
  const confirmedRevenue = confirmed.reduce((s, o) => s + o.total, 0)
  const avgOrderValue = active.length > 0 ? totalRevenue / active.length : 0

  // ─── Repeat customer rate ───
  const custOrders: Record<string, number> = {}
  for (const o of allOrders.filter(o => o.status !== 'cancelled' && o.userId)) {
    custOrders[o.userId!] = (custOrders[o.userId!] || 0) + 1
  }
  const totalWithOrders = Object.keys(custOrders).length
  const repeatCount = Object.values(custOrders).filter(c => c > 1).length
  const repeatCustomerRate = totalWithOrders > 0 ? (repeatCount / totalWithOrders * 100) : 0

  // ─── Top 10 products by revenue ───
  const prodMap: Record<string, { name: string; slug: string; category: string; revenue: number; units: number }> = {}
  for (const o of active) {
    for (const item of o.items) {
      const k = item.productId
      if (!prodMap[k]) prodMap[k] = { name: item.product.name, slug: item.product.slug, category: item.product.category, revenue: 0, units: 0 }
      prodMap[k].revenue += item.price * item.quantity
      prodMap[k].units += item.quantity
    }
  }
  const topProducts = Object.entries(prodMap)
    .map(([id, d]) => ({ id, ...d, revenue: Math.round(d.revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // ─── Discount impact ───
  const totalDiscount = active.reduce((s, o) => s + o.discount, 0)
  const couponOrders = active.filter(o => o.couponCode)

  return NextResponse.json({
    period: `${days}d`,
    groupBy,
    since: since.toISOString(),
    summary: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      confirmedRevenue: Math.round(confirmedRevenue * 100) / 100,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      totalOrders: active.length,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      couponOrderCount: couponOrders.length,
      repeatCustomerRate: Math.round(repeatCustomerRate * 10) / 10,
    },
    revenueTrend,
    revenueByCategory,
    revenueByPaymentMethod,
    topProducts,
  })
}
