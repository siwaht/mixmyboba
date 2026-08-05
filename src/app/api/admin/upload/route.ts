import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

/** Files land in `public/`, so only image types are accepted. */
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg'] as const
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const filename = formData.get('filename') as string | null
  const base64 = formData.get('base64') as string | null
  const contentType = formData.get('contentType') as string | null

  const dir = join(process.cwd(), 'public', 'products')
  await mkdir(dir, { recursive: true })

  // Support two modes: browser file upload, or base64 (used by the MCP tools)
  if (base64 && filename) {
    const ext = extensionOf(filename) || guessExtension(contentType || '')
    const rejection = rejectBadExtension(ext)
    if (rejection) return rejection

    let buffer: Buffer
    try {
      buffer = Buffer.from(base64, 'base64')
    } catch {
      return NextResponse.json({ error: 'base64 payload could not be decoded' }, { status: 400 })
    }
    if (buffer.byteLength === 0) {
      return NextResponse.json({ error: 'base64 payload is empty' }, { status: 400 })
    }
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Image must be 5 MB or smaller' }, { status: 413 })
    }

    const stem = stripExtension(filename)
    const safeName = sanitizeFilename(`${stem}.${ext}`)
    await writeFile(join(dir, safeName), buffer)
    return NextResponse.json({ url: `/products/${safeName}`, filename: safeName })
  }

  if (file) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image must be 5 MB or smaller' }, { status: 413 })
    }

    const ext = extensionOf(file.name) || guessExtension(file.type)
    const rejection = rejectBadExtension(ext)
    if (rejection) return rejection

    const stem = filename ? stripExtension(filename) : stripExtension(file.name)
    const safeName = sanitizeFilename(`${stem}.${ext}`)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(join(dir, safeName), buffer)
    return NextResponse.json({ url: `/products/${safeName}`, filename: safeName })
  }

  return NextResponse.json({ error: 'Provide either a file or base64 + filename' }, { status: 400 })
}

function rejectBadExtension(ext: string): NextResponse | null {
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return NextResponse.json(
      { error: `Unsupported image type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` },
      { status: 400 }
    )
  }
  return null
}

function extensionOf(name: string): string {
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

/**
 * Collapses anything that isn't a safe filename character, which also removes
 * any path separators or `..` traversal attempt in the supplied name.
 */
function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^a-z0-9._-]/gi, '-').replace(/^[.-]+/, '').toLowerCase()
  return cleaned || `upload-${Date.now()}.png`
}

function guessExtension(contentType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
    'image/avif': 'avif',
  }
  return map[contentType] || ''
}
