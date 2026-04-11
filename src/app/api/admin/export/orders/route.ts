import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const orders = await prisma.order.findMany({
    include: {
      items: { include: { product: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'id', 'email', 'customerName', 'status', 'paymentMethod', 'subtotal',
    'discount', 'total', 'couponCode', 'shippingAddress', 'items', 'notes', 'createdAt',
  ]
  const csvRows = [headers.join(',')]

  for (const o of orders) {
    const itemsSummary = o.items.map(i => `${i.product.name} x${i.quantity}`).join('; ')
    const row = [
      o.id,
      o.email,
      o.user?.name ? `"${o.user.name.replace(/"/g, '""')}"` : '',
      o.status,
      o.paymentMethod,
      o.subtotal.toFixed(2),
      o.discount.toFixed(2),
      o.total.toFixed(2),
      o.couponCode || '',
      `"${o.shippingAddress.replace(/"/g, '""')}"`,
      `"${itemsSummary.replace(/"/g, '""')}"`,
      o.notes ? `"${o.notes.replace(/"/g, '""')}"` : '',
      o.createdAt.toISOString(),
    ]
    csvRows.push(row.join(','))
  }

  return new NextResponse(csvRows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
