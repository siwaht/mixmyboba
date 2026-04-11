import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      variants: { where: { active: true }, orderBy: { price: 'asc' } },
      coas: { orderBy: { testDate: 'desc' }, take: 5 },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const avgRating = product.reviews.length
    ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
    : null

  return NextResponse.json({ ...product, avgRating, reviewCount: product.reviews.length })
}
