import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const products = await prisma.product.findMany({
    include: { variants: true },
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'id', 'slug', 'name', 'price', 'description', 'imageUrl', 'category',
    'purity', 'stock', 'active', 'tag', 'molecularWeight', 'sequence', 'casNumber',
    'storageTemp', 'form', 'batchNumber', 'lotNumber', 'createdAt',
  ]

  const csvRows = [headers.join(',')]
  for (const p of products) {
    const row = headers.map(h => {
      const val = (p as Record<string, unknown>)[h]
      if (val === null || val === undefined) return ''
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    })
    csvRows.push(row.join(','))
  }

  return new NextResponse(csvRows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="products-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
