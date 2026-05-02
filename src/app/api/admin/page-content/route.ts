import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { safeJson, isErrorResponse } from '@/lib/safe-json'
import { DEFAULT_PAGE_CONTENT } from '@/lib/default-page-content'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

const CONTENT_PATH = join(process.cwd(), 'page-content.json')

function getContent() {
  if (!existsSync(CONTENT_PATH)) {
    writeFileSync(CONTENT_PATH, JSON.stringify(DEFAULT_PAGE_CONTENT, null, 2))
    return DEFAULT_PAGE_CONTENT
  }
  try {
    const raw = JSON.parse(readFileSync(CONTENT_PATH, 'utf-8'))
    // Merge with defaults so new fields are always present
    return { ...DEFAULT_PAGE_CONTENT, ...raw }
  } catch {
    return DEFAULT_PAGE_CONTENT
  }
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  return NextResponse.json(getContent())
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  const data = await safeJson(req)
  if (isErrorResponse(data)) return data
  writeFileSync(CONTENT_PATH, JSON.stringify(data, null, 2))
  return NextResponse.json(data)
}
