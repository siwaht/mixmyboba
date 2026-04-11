import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { bulkStockUpdateSchema } from '@/lib/validations'
import { safeJson, isErrorResponse } from '@/lib/safe-json'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body

  const parsed = bulkStockUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const results = []
  for (const { id, stock } of parsed.data.updates) {
    try {
      const product = await prisma.product.update({
        where: { id },
        data: { stock },
        select: { id: true, name: true, stock: true },
      })
      results.push({ ...product, success: true })
    } catch {
      results.push({ id, success: false, error: 'Product not found' })
    }
  }

  return NextResponse.json({ updated: results.filter(r => r.success).length, results })
}
