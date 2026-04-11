import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, signToken } from '@/lib/auth'
import { safeJson, isErrorResponse } from '@/lib/safe-json'

// Generate an admin auth token for MCP/API usage
export async function POST(req: NextRequest) {
  const body = await safeJson(req)
  if (isErrorResponse(body)) return body
  const { email, password } = body as { email: string; password: string }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.password)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const token = signToken({ userId: user.id, role: user.role })

  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    usage: 'Set this token as CELLULA_ADMIN_TOKEN in your MCP server config',
  })
}
