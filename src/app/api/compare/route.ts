import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/compare?ids=id1,id2,id3
export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get('ids')
  if (!ids) {
    return NextResponse.json({ error: 'ids query param required (comma-separated)' }, { status: 400 })
  }

  const productIds = ids.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4)
  if (productIds.length < 2) {
    return NextResponse.json({ error: 'At least 2 product IDs required' }, { status: 400 })
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
    include: {
      variants: { where: { active: true }, orderBy: { price: 'asc' } },
      reviews: { select: { rating: true } },
    },
  })

  const enriched = products.map(p => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    imageUrl: p.imageUrl,
    category: p.category,
    purity: p.purity,
    stock: p.stock,
    molecularWeight: p.molecularWeight,
    sequence: p.sequence,
    casNumber: p.casNumber,
    storageTemp: p.storageTemp,
    form: p.form,
    tag: p.tag,
    startingPrice: p.variants.length ? p.variants[0].price : p.price,
    variantCount: p.variants.length,
    avgRating: p.reviews.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : null,
    reviewCount: p.reviews.length,
  }))

  return NextResponse.json(enriched)
}
