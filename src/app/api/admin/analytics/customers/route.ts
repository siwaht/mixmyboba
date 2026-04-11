import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/admin/analytics/customers?id=xxx  (single customer LTV)
// GET /api/admin/analytics/customers           (all customers LTV summary)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const url = new URL(req.url)
  const customerId = url.searchParams.get('id')

  if (customerId) {
    return singleCustomerLTV(customerId)
  }
  return allCustomersLTV()
}

async function singleCustomerLTV(customerId: string) {
  const customer = await prisma.user.findUnique({
    where: { id: customerId },
    select: {
      id: true, email: true, name: true, createdAt: true,
      orders: {
        where: { status: { not: 'cancelled' } },
        select: { id: true, total: true, discount: true, status: true, createdAt: true, paymentMethod: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  const orders = customer.orders
  const totalSpent = orders.reduce((s, o) => s + o.total, 0)
  const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0

  // Order frequency: avg days between orders
  let avgDaysBetweenOrders: number | null = null
  if (orders.length >= 2) {
    const sorted = [...orders].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    let totalGap = 0
    for (let i = 1; i < sorted.length; i++) {
      totalGap += (sorted[i].createdAt.getTime() - sorted[i - 1].createdAt.getTime()) / (1000 * 60 * 60 * 24)
    }
    avgDaysBetweenOrders = Math.round(totalGap / (sorted.length - 1) * 10) / 10
  }

  // Days since last order
  const lastOrder = orders[0] // already sorted desc
  const daysSinceLastOrder = lastOrder
    ? Math.round((Date.now() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Customer tenure in days
  const tenureDays = Math.round((Date.now() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24))

  // Churn risk: based on order frequency and recency
  let churnRisk: 'low' | 'medium' | 'high' | 'churned' = 'low'
  if (orders.length === 0) {
    churnRisk = 'high'
  } else if (daysSinceLastOrder !== null && avgDaysBetweenOrders !== null) {
    const ratio = daysSinceLastOrder / avgDaysBetweenOrders
    if (ratio > 3) churnRisk = 'churned'
    else if (ratio > 2) churnRisk = 'high'
    else if (ratio > 1.5) churnRisk = 'medium'
  } else if (daysSinceLastOrder !== null && daysSinceLastOrder > 90) {
    churnRisk = orders.length === 1 ? 'high' : 'medium'
  }

  // Projected annual LTV (based on order frequency and AOV)
  let projectedAnnualLTV: number | null = null
  if (avgDaysBetweenOrders && avgDaysBetweenOrders > 0) {
    const ordersPerYear = 365 / avgDaysBetweenOrders
    projectedAnnualLTV = Math.round(ordersPerYear * avgOrderValue * 100) / 100
  }

  return NextResponse.json({
    customer: {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      memberSince: customer.createdAt.toISOString(),
      tenureDays,
    },
    ltv: {
      totalSpent: Math.round(totalSpent * 100) / 100,
      orderCount: orders.length,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      avgDaysBetweenOrders,
      daysSinceLastOrder,
      projectedAnnualLTV,
      churnRisk,
    },
    recentOrders: orders.slice(0, 5).map(o => ({
      id: o.id,
      total: o.total,
      status: o.status,
      paymentMethod: o.paymentMethod,
      date: o.createdAt.toISOString(),
    })),
  })
}

async function allCustomersLTV() {
  const customers = await prisma.user.findMany({
    where: { role: 'customer' },
    select: {
      id: true, email: true, name: true, createdAt: true,
      orders: {
        where: { status: { not: 'cancelled' } },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  const now = Date.now()
  const results = customers
    .filter(c => c.orders.length > 0)
    .map(c => {
      const totalSpent = c.orders.reduce((s, o) => s + o.total, 0)
      const avgOrderValue = totalSpent / c.orders.length
      const daysSinceLastOrder = Math.round((now - c.orders[0].createdAt.getTime()) / (1000 * 60 * 60 * 24))

      let avgDaysBetweenOrders: number | null = null
      if (c.orders.length >= 2) {
        const sorted = [...c.orders].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        let totalGap = 0
        for (let i = 1; i < sorted.length; i++) {
          totalGap += (sorted[i].createdAt.getTime() - sorted[i - 1].createdAt.getTime()) / (1000 * 60 * 60 * 24)
        }
        avgDaysBetweenOrders = Math.round(totalGap / (sorted.length - 1) * 10) / 10
      }

      let churnRisk: string = 'low'
      if (daysSinceLastOrder > 90 && c.orders.length === 1) churnRisk = 'high'
      else if (avgDaysBetweenOrders && daysSinceLastOrder / avgDaysBetweenOrders > 3) churnRisk = 'churned'
      else if (avgDaysBetweenOrders && daysSinceLastOrder / avgDaysBetweenOrders > 2) churnRisk = 'high'
      else if (avgDaysBetweenOrders && daysSinceLastOrder / avgDaysBetweenOrders > 1.5) churnRisk = 'medium'

      let projectedAnnualLTV: number | null = null
      if (avgDaysBetweenOrders && avgDaysBetweenOrders > 0) {
        projectedAnnualLTV = Math.round((365 / avgDaysBetweenOrders) * avgOrderValue * 100) / 100
      }

      return {
        id: c.id,
        email: c.email,
        name: c.name,
        totalSpent: Math.round(totalSpent * 100) / 100,
        orderCount: c.orders.length,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        daysSinceLastOrder,
        avgDaysBetweenOrders,
        projectedAnnualLTV,
        churnRisk,
      }
    })
    .sort((a, b) => b.totalSpent - a.totalSpent)

  // Summary stats
  const totalLTV = results.reduce((s, r) => s + r.totalSpent, 0)
  const avgLTV = results.length > 0 ? totalLTV / results.length : 0
  const churnBreakdown: Record<string, number> = {}
  for (const r of results) {
    churnBreakdown[r.churnRisk] = (churnBreakdown[r.churnRisk] || 0) + 1
  }

  return NextResponse.json({
    summary: {
      totalCustomersWithOrders: results.length,
      avgLifetimeValue: Math.round(avgLTV * 100) / 100,
      totalLifetimeRevenue: Math.round(totalLTV * 100) / 100,
      churnBreakdown,
    },
    customers: results,
  })
}
