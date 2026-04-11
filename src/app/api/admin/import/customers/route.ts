import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, hashPassword } from '@/lib/auth'

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0])
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h.trim()] = (values[i] || '').trim() })
    return obj
  })
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++ }
      else if (ch === '"') { inQuotes = false }
      else { current += ch }
    } else {
      if (ch === '"') { inQuotes = true }
      else if (ch === ',') { result.push(current); current = '' }
      else { current += ch }
    }
  }
  result.push(current)
  return result
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const text = await file.text()
  const rows = parseCSV(text)
  if (rows.length === 0) {
    return NextResponse.json({ error: 'No data rows found in CSV' }, { status: 400 })
  }

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    try {
      if (!row.email) {
        skipped++
        errors.push('Skipped row: missing email')
        continue
      }

      const existing = await prisma.user.findUnique({ where: { email: row.email.toLowerCase() } })
      if (existing) {
        // Update name/role if provided
        await prisma.user.update({
          where: { email: row.email.toLowerCase() },
          data: {
            ...(row.name ? { name: row.name } : {}),
            ...(row.role && ['customer', 'admin'].includes(row.role) ? { role: row.role } : {}),
          },
        })
      } else {
        const password = row.password || 'ChangeMe123!'
        const hashed = await hashPassword(password)
        await prisma.user.create({
          data: {
            email: row.email.toLowerCase().trim(),
            password: hashed,
            name: row.name || null,
            role: row.role && ['customer', 'admin'].includes(row.role) ? row.role : 'customer',
          },
        })
      }
      imported++
    } catch (e) {
      skipped++
      errors.push(`Error on "${row.email}": ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }

  return NextResponse.json({ imported, skipped, total: rows.length, errors: errors.slice(0, 10) })
}
