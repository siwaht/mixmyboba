import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const filename = formData.get('filename') as string | null
  const base64 = formData.get('base64') as string | null
  const contentType = formData.get('contentType') as string | null

  const dir = join(process.cwd(), 'public', 'products')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  // Support two modes: file upload or base64 upload
  if (base64 && filename) {
    // Base64 mode — for AI agents sending image data
    const ext = filename.includes('.') ? '' : guessExtension(contentType || '')
    const safeName = sanitizeFilename(filename + ext)
    const buffer = Buffer.from(base64, 'base64')
    writeFileSync(join(dir, safeName), buffer)
    return NextResponse.json({ url: `/products/${safeName}`, filename: safeName })
  }

  if (file) {
    // File upload mode — for browser form uploads
    const ext = file.name.split('.').pop() || 'png'
    const baseName = (filename || file.name.replace(/\.[^.]+$/, '')).toLowerCase()
    const safeName = sanitizeFilename(`${baseName}.${ext}`)
    const buffer = Buffer.from(await file.arrayBuffer())
    writeFileSync(join(dir, safeName), buffer)
    return NextResponse.json({ url: `/products/${safeName}`, filename: safeName })
  }

  return NextResponse.json({ error: 'Provide either a file or base64 + filename' }, { status: 400 })
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9._-]/gi, '-').toLowerCase()
}

function guessExtension(contentType: string): string {
  const map: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'image/webp': '.webp',
  }
  return map[contentType] || '.png'
}
