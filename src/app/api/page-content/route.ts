import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { DEFAULT_PAGE_CONTENT } from '@/app/api/admin/page-content/route'

const CONTENT_PATH = join(process.cwd(), 'page-content.json')

export async function GET() {
  if (!existsSync(CONTENT_PATH)) {
    return NextResponse.json(DEFAULT_PAGE_CONTENT)
  }
  try {
    const raw = JSON.parse(readFileSync(CONTENT_PATH, 'utf-8'))
    return NextResponse.json({ ...DEFAULT_PAGE_CONTENT, ...raw })
  } catch {
    return NextResponse.json(DEFAULT_PAGE_CONTENT)
  }
}
