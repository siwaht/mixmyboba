import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

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
      if (!row.slug || !row.name || !row.price) {
        skipped++
        errors.push(`Skipped row: missing slug, name, or price`)
        continue
      }

      const existing = await prisma.product.findUnique({ where: { slug: row.slug } })
      if (existing) {
        // Update existing product
        await prisma.product.update({
          where: { slug: row.slug },
          data: {
            name: row.name,
            price: parseFloat(row.price) || 0,
            description: row.description || '',
            imageUrl: row.imageUrl || '/products/default.svg',
            category: row.category || 'General',
            purity: row.purity || '20+ Servings',
            stock: parseInt(row.stock) || 100,
            active: row.active !== 'false',
            tag: row.tag || null,
            molecularWeight: row.molecularWeight || null,
            sequence: row.sequence || null,
            casNumber: row.casNumber || null,
            storageTemp: row.storageTemp || 'Cool & Dry',
            form: row.form || 'Instant Powder Mix',
            batchNumber: row.batchNumber || null,
            lotNumber: row.lotNumber || null,
          },
        })
      } else {
        await prisma.product.create({
          data: {
            slug: row.slug,
            name: row.name,
            price: parseFloat(row.price) || 0,
            description: row.description || '',
            imageUrl: row.imageUrl || '/products/default.svg',
            category: row.category || 'General',
            purity: row.purity || '20+ Servings',
            stock: parseInt(row.stock) || 100,
            active: row.active !== 'false',
            tag: row.tag || null,
            molecularWeight: row.molecularWeight || null,
            sequence: row.sequence || null,
            casNumber: row.casNumber || null,
            storageTemp: row.storageTemp || 'Cool & Dry',
            form: row.form || 'Instant Powder Mix',
            batchNumber: row.batchNumber || null,
            lotNumber: row.lotNumber || null,
          },
        })
      }
      imported++
    } catch (e) {
      skipped++
      errors.push(`Error on slug "${row.slug}": ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }

  return NextResponse.json({ imported, skipped, total: rows.length, errors: errors.slice(0, 10) })
}
