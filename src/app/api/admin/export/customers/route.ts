import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    include: { orders: { select: { id: true, total: true, status: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const headers = ['id', 'email', 'name', 'role', 'totalOrders', 'totalSpent', 'createdAt']
  const csvRows = [headers.join(',')]

  for (const u of users) {
    const totalSpent = u.orders.reduce((sum, o) => sum + o.total, 0)
    const row = [
      u.id,
      u.email,
      u.name ? `"${u.name.replace(/"/g, '""')}"` : '',
      u.role,
      String(u.orders.length),
      totalSpent.toFixed(2),
      u.createdAt.toISOString(),
    ]
    csvRows.push(row.join(','))
  }

  return new NextResponse(csvRows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="customers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
