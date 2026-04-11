import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const search = searchParams.get('search')
  const role = searchParams.get('role')

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { email: { contains: search } },
      { name: { contains: search } },
    ]
  }
  if (role) where.role = role

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      orders: {
        select: { id: true, total: true, status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(users)
}
