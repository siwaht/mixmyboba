import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { safeJson, isErrorResponse } from '@/lib/safe-json'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

// List COAs for a product
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  const { id } = await params
  const coas = await prisma.cOA.findMany({
    where: { productId: id },
    orderBy: { testDate: 'desc' },
  })
  return NextResponse.json(coas)
}

// Create a COA
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  const { id } = await params
  const data = await safeJson<Record<string, string>>(req)
  if (isErrorResponse(data)) return data

  if (!data.batchNumber || !data.purityResult || !data.fileUrl) {
    return NextResponse.json({ error: 'batchNumber, purityResult, and fileUrl are required' }, { status: 400 })
  }

  const coa = await prisma.cOA.create({
    data: {
      productId: id,
      batchNumber: data.batchNumber,
      labName: data.labName || 'Janoshik Analytics',
      testDate: data.testDate ? new Date(data.testDate) : new Date(),
      purityResult: data.purityResult,
      fileUrl: data.fileUrl,
    },
  })
  return NextResponse.json(coa, { status: 201 })
}

// Delete a COA
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  const body = await safeJson(req)
  if (isErrorResponse(body)) return body
  const { coaId } = body as { coaId: string }
  if (!coaId) {
    return NextResponse.json({ error: 'coaId is required' }, { status: 400 })
  }
  await prisma.cOA.delete({ where: { id: coaId } })
  return NextResponse.json({ success: true })
}
