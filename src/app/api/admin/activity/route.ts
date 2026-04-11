import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/admin/activity?since=ISO_DATE&limit=50
// Returns a unified feed of recent events across the store
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const url = new URL(req.url)
  const sinceParam = url.searchParams.get('since')
  const limitParam = url.searchParams.get('limit')
  const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 24 * 60 * 60 * 1000) // default: last 24h
  const limit = Math.min(parseInt(limitParam || '50'), 200)

  // Fetch recent data in parallel
  const [recentOrders, recentReviews, recentUsers, recentProducts, lowStock] = await Promise.all([
    // Recent orders (new + status changes)
    prisma.order.findMany({
      where: { OR: [{ createdAt: { gte: since } }, { updatedAt: { gte: since } }] },
      include: {
        items: { include: { product: { select: { name: true, slug: true } } } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    }),
    // Recent reviews
    prisma.review.findMany({
      where: { createdAt: { gte: since } },
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    // New signups
    prisma.user.findMany({
      where: { createdAt: { gte: since }, role: 'customer' },
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    // Recently updated products (stock changes, edits)
    prisma.product.findMany({
      where: { updatedAt: { gte: since } },
      select: { id: true, name: true, slug: true, stock: true, active: true, price: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    }),
    // Low stock alerts (always included)
    prisma.product.findMany({
      where: { stock: { lte: 20 }, active: true },
      select: { id: true, name: true, slug: true, stock: true, category: true },
      orderBy: { stock: 'asc' },
    }),
  ])

  // Build unified event feed
  const events: Array<{ type: string; timestamp: string; summary: string; data: unknown }> = []

  for (const order of recentOrders) {
    const itemsSummary = order.items.map(i => `${i.product.name} x${i.quantity}`).join(', ')
    const isNew = order.createdAt.getTime() >= since.getTime()
    const wasUpdated = order.updatedAt.getTime() > order.createdAt.getTime() && order.updatedAt.getTime() >= since.getTime()

    if (isNew) {
      events.push({
        type: 'new_order',
        timestamp: order.createdAt.toISOString(),
        summary: `New order #${order.id.slice(-8)} from ${order.email} — $${order.total.toFixed(2)} (${order.paymentMethod}) — ${itemsSummary}`,
        data: { orderId: order.id, email: order.email, total: order.total, status: order.status, items: itemsSummary, paymentMethod: order.paymentMethod },
      })
    }
    if (wasUpdated && !isNew) {
      events.push({
        type: 'order_updated',
        timestamp: order.updatedAt.toISOString(),
        summary: `Order #${order.id.slice(-8)} status changed to "${order.status}" — ${order.email}`,
        data: { orderId: order.id, email: order.email, status: order.status, total: order.total },
      })
    }
  }

  for (const review of recentReviews) {
    events.push({
      type: 'new_review',
      timestamp: review.createdAt.toISOString(),
      summary: `${review.user.name || review.user.email} left a ${review.rating}★ review on ${review.product.name}: "${review.title}"`,
      data: { reviewId: review.id, productName: review.product.name, rating: review.rating, title: review.title, verified: review.verified },
    })
  }

  for (const u of recentUsers) {
    events.push({
      type: 'new_customer',
      timestamp: u.createdAt.toISOString(),
      summary: `New customer signup: ${u.name || u.email}`,
      data: { userId: u.id, email: u.email, name: u.name },
    })
  }

  for (const p of recentProducts) {
    events.push({
      type: 'product_updated',
      timestamp: p.updatedAt.toISOString(),
      summary: `Product "${p.name}" was updated (stock: ${p.stock}, active: ${p.active}, price: $${p.price.toFixed(2)})`,
      data: { productId: p.id, name: p.name, slug: p.slug, stock: p.stock, active: p.active, price: p.price },
    })
  }

  // Sort all events by timestamp descending
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return NextResponse.json({
    since: since.toISOString(),
    eventCount: events.length,
    lowStockAlerts: lowStock,
    events: events.slice(0, limit),
  })
}
