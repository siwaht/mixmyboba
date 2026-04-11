import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/products/:slug/related — find products frequently bought together
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Find the product by slug first
  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true, category: true } })
  if (!product) return NextResponse.json([])

  const id = product.id

  // Find orders that contain this product
  const orderIds = await prisma.orderItem.findMany({
    where: { productId: id },
    select: { orderId: true },
    take: 100,
  })

  if (orderIds.length === 0) {
    // Fallback: return products from same category
    const related = await prisma.product.findMany({
      where: { category: product.category, id: { not: id }, active: true },
      select: { id: true, slug: true, name: true, price: true, imageUrl: true, purity: true, category: true },
      take: 4,
    })
    return NextResponse.json(related)
  }

  // Find other products in those same orders
  const coProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      orderId: { in: orderIds.map(o => o.orderId) },
      productId: { not: id },
    },
    _count: { productId: true },
    orderBy: { _count: { productId: 'desc' } },
    take: 4,
  })

  const productIds = coProducts.map(p => p.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
    select: { id: true, slug: true, name: true, price: true, imageUrl: true, purity: true, category: true },
  })

  // Maintain the frequency order
  const ordered = productIds.map(pid => products.find(p => p.id === pid)).filter(Boolean)
  return NextResponse.json(ordered)
}
