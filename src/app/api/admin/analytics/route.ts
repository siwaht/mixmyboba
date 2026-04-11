import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/admin/analytics?period=30d
// Returns revenue analytics, customer insights, product performance
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const url = new URL(req.url)
  const period = url.searchParams.get('period') || '30d'

  // Parse period
  let days = 30
  if (period.endsWith('d')) days = parseInt(period) || 30
  else if (period.endsWith('w')) days = (parseInt(period) || 4) * 7
  else if (period === 'all') days = 3650 // ~10 years
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [allOrders, allCustomers, allProducts, allReviews] = await Promise.all([
    prisma.order.findMany({
      include: { items: { include: { product: { select: { name: true, slug: true, category: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({
      where: { role: 'customer' },
      select: { id: true, email: true, name: true, createdAt: true },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, slug: true, category: true, price: true, stock: true, active: true },
    }),
    prisma.review.findMany({
      select: { productId: true, rating: true },
    }),
  ])

  const periodOrders = allOrders.filter(o => o.createdAt >= since)
  const nonCancelledPeriod = periodOrders.filter(o => o.status !== 'cancelled')
  const confirmedPeriod = periodOrders.filter(o => ['paid', 'shipped', 'delivered'].includes(o.status))

  // ─── Revenue metrics ───
  const totalRevenue = nonCancelledPeriod.reduce((s, o) => s + o.total, 0)
  const confirmedRevenue = confirmedPeriod.reduce((s, o) => s + o.total, 0)
  const avgOrderValue = nonCancelledPeriod.length > 0 ? totalRevenue / nonCancelledPeriod.length : 0
  const totalDiscount = nonCancelledPeriod.reduce((s, o) => s + o.discount, 0)

  // ─── Revenue by day (last N days) ───
  const revenueByDay: Record<string, number> = {}
  for (const o of nonCancelledPeriod) {
    const day = o.createdAt.toISOString().split('T')[0]
    revenueByDay[day] = (revenueByDay[day] || 0) + o.total
  }

  // ─── Revenue by payment method ───
  const revenueByPayment: Record<string, { count: number; revenue: number }> = {}
  for (const o of nonCancelledPeriod) {
    if (!revenueByPayment[o.paymentMethod]) revenueByPayment[o.paymentMethod] = { count: 0, revenue: 0 }
    revenueByPayment[o.paymentMethod].count++
    revenueByPayment[o.paymentMethod].revenue += o.total
  }

  // ─── Revenue by category ───
  const revenueByCategory: Record<string, { revenue: number; unitsSold: number }> = {}
  for (const o of nonCancelledPeriod) {
    for (const item of o.items) {
      const cat = item.product.category
      if (!revenueByCategory[cat]) revenueByCategory[cat] = { revenue: 0, unitsSold: 0 }
      revenueByCategory[cat].revenue += item.price * item.quantity
      revenueByCategory[cat].unitsSold += item.quantity
    }
  }

  // ─── Top products by revenue (period) ───
  const productPerf: Record<string, { name: string; slug: string; category: string; revenue: number; unitsSold: number; orderCount: number }> = {}
  for (const o of nonCancelledPeriod) {
    for (const item of o.items) {
      const key = item.productId
      if (!productPerf[key]) productPerf[key] = { name: item.product.name, slug: item.product.slug, category: item.product.category, revenue: 0, unitsSold: 0, orderCount: 0 }
      productPerf[key].revenue += item.price * item.quantity
      productPerf[key].unitsSold += item.quantity
      productPerf[key].orderCount++
    }
  }
  const topProducts = Object.entries(productPerf)
    .map(([id, d]) => ({ id, ...d }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const worstProducts = Object.entries(productPerf)
    .map(([id, d]) => ({ id, ...d }))
    .sort((a, b) => a.revenue - b.revenue)
    .slice(0, 5)

  // ─── Customer insights ───
  const customerOrderCounts: Record<string, number> = {}
  for (const o of allOrders.filter(o => o.status !== 'cancelled' && o.userId)) {
    customerOrderCounts[o.userId!] = (customerOrderCounts[o.userId!] || 0) + 1
  }
  const repeatCustomers = Object.values(customerOrderCounts).filter(c => c > 1).length
  const totalCustomersWithOrders = Object.keys(customerOrderCounts).length
  const repeatRate = totalCustomersWithOrders > 0 ? (repeatCustomers / totalCustomersWithOrders * 100) : 0

  const newCustomersPeriod = allCustomers.filter(c => c.createdAt >= since).length

  // ─── Coupon usage ───
  const couponOrders = nonCancelledPeriod.filter(o => o.couponCode)
  const couponUsageRate = nonCancelledPeriod.length > 0 ? (couponOrders.length / nonCancelledPeriod.length * 100) : 0

  // ─── Review summary ───
  const avgRating = allReviews.length > 0 ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length : 0

  // ─── Order status breakdown (period) ───
  const statusBreakdown: Record<string, number> = {}
  for (const o of periodOrders) {
    statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1
  }

  return NextResponse.json({
    period: `${days}d`,
    since: since.toISOString(),
    revenue: {
      total: Math.round(totalRevenue * 100) / 100,
      confirmed: Math.round(confirmedRevenue * 100) / 100,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      orderCount: nonCancelledPeriod.length,
      byDay: revenueByDay,
      byPaymentMethod: revenueByPayment,
      byCategory: revenueByCategory,
    },
    orders: {
      total: periodOrders.length,
      statusBreakdown,
    },
    customers: {
      total: allCustomers.length,
      newInPeriod: newCustomersPeriod,
      withOrders: totalCustomersWithOrders,
      repeatCustomers,
      repeatRate: Math.round(repeatRate * 10) / 10,
    },
    products: {
      total: allProducts.length,
      active: allProducts.filter(p => p.active).length,
      topPerformers: topProducts,
      worstPerformers: worstProducts,
      avgRating: Math.round(avgRating * 100) / 100,
      totalReviews: allReviews.length,
    },
    coupons: {
      ordersWithCoupon: couponOrders.length,
      usageRate: Math.round(couponUsageRate * 10) / 10,
    },
  })
}
