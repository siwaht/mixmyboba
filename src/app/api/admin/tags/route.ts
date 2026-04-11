import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { safeJson, isErrorResponse } from '@/lib/safe-json'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

const TAGS_PATH = join(process.cwd(), 'product-tags.json')

interface ProductTag {
  slug: string
  label: string
  emoji: string
  color: string
}

const DEFAULT_TAGS: ProductTag[] = [
  { slug: 'best_seller', label: 'Best Seller', emoji: '🏆', color: '#f59e0b' },
  { slug: 'fast_selling', label: 'Fast Selling', emoji: '🔥', color: '#ef4444' },
  { slug: 'last_few_left', label: 'Last Few Left', emoji: '⚡', color: '#f97316' },
  { slug: 'staff_pick', label: 'Staff Pick', emoji: '⭐', color: '#8b5cf6' },
  { slug: 'new', label: 'New', emoji: '🆕', color: '#22c55e' },
  { slug: 'popular', label: 'Popular', emoji: '📈', color: '#3b82f6' },
]

function getTags(): ProductTag[] {
  if (!existsSync(TAGS_PATH)) {
    writeFileSync(TAGS_PATH, JSON.stringify(DEFAULT_TAGS, null, 2))
    return DEFAULT_TAGS
  }
  return JSON.parse(readFileSync(TAGS_PATH, 'utf-8'))
}

function saveTags(tags: ProductTag[]) {
  writeFileSync(TAGS_PATH, JSON.stringify(tags, null, 2))
}

// GET — list all tags
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  return NextResponse.json(getTags())
}

// POST — create a new tag
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await safeJson(req)
  if (isErrorResponse(body)) return body
  const { slug, label, emoji, color } = body as { slug: string; label: string; emoji?: string; color: string }
  if (!slug || !label || !color) {
    return NextResponse.json({ error: 'slug, label, and color are required' }, { status: 400 })
  }

  const tags = getTags()
  if (tags.find(t => t.slug === slug)) {
    return NextResponse.json({ error: 'Tag with this slug already exists' }, { status: 409 })
  }

  const newTag: ProductTag = { slug, label, emoji: emoji || '🏷️', color }
  tags.push(newTag)
  saveTags(tags)
  return NextResponse.json(newTag, { status: 201 })
}

// PUT — update all tags (bulk replace)
export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const tags = await safeJson(req)
  if (isErrorResponse(tags)) return tags
  if (!Array.isArray(tags)) {
    return NextResponse.json({ error: 'Expected array of tags' }, { status: 400 })
  }
  saveTags(tags)
  return NextResponse.json(tags)
}

// DELETE — delete a tag by slug (passed as ?slug=xxx)
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ error: 'slug query param required' }, { status: 400 })
  }

  const tags = getTags()
  const filtered = tags.filter(t => t.slug !== slug)
  if (filtered.length === tags.length) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
  }
  saveTags(filtered)
  return NextResponse.json({ success: true, remaining: filtered.length })
}
