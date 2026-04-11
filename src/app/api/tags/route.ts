import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const TAGS_PATH = join(process.cwd(), 'product-tags.json')

export async function GET() {
  if (!existsSync(TAGS_PATH)) {
    return NextResponse.json([])
  }
  const tags = JSON.parse(readFileSync(TAGS_PATH, 'utf-8'))
  return NextResponse.json(tags)
}
