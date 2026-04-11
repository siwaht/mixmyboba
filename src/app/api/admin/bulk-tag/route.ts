import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { safeJson, isErrorResponse } from '@/lib/safe-json'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

// POST — bulk assign or remove tags
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body
  const { productIds, tag } = body as { productIds: string[]; tag: string }
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ error: 'productIds array required' }, { status: 400 })
  }

  const result = await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data: { tag: tag || null },
  })

  return NextResponse.json({ success: true, updated: result.count })
}
