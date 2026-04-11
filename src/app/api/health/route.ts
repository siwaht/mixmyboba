import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  let database = 'disconnected'
  try {
    await prisma.$queryRawUnsafe('SELECT 1')
    database = 'connected'
  } catch {
    database = 'error'
  }

  const status = database === 'connected' ? 'ok' : 'degraded'

  return NextResponse.json(
    { status, database, timestamp: new Date().toISOString() },
    { status: status === 'ok' ? 200 : 503 }
  )
}
