import { Suspense } from 'react'
import ProductGrid from '@/components/ProductGrid'
import { prisma } from '@/lib/db'
import { getCachedJson } from '@/lib/settings-cache'

export const metadata = {
  title: 'Shop All Flavors',
  description: 'Browse our full collection of functional boba tea mixes — date-sweetened, adaptogen-infused, and gut-friendly.',
}

export default async function ShopPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      variants: { where: { active: true }, orderBy: { price: 'asc' } },
      reviews: { select: { rating: true } },
    },
  })

  const pc = await getCachedJson<Record<string, unknown>>('page-content.json', {})
  const hp = (pc.homepage ?? {}) as Record<string, unknown>
  const store = (hp.storeSection ?? {}) as Record<string, unknown>
  const storeTitle = (store.title as string) || 'Find Your Flavor'
  const storeSubtitle = (store.subtitle as string) || 'Classic milk tea, taro, matcha, brown sugar, and more — each with its own functional superpower. Date-sweetened, adaptogen-infused, gut-friendly.'

  const initialProducts = products.map(p => ({
    ...p,
    avgRating: p.reviews.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : null,
    reviewCount: p.reviews.length,
    startingPrice: p.variants.length ? p.variants[0].price : p.price,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    variants: p.variants.map(v => ({ ...v })),
    reviews: p.reviews,
  }))

  return (
    <section id="store" className="store-section" aria-labelledby="store-heading">
      <div className="container">
        <div className="section-head">
          <h2 id="store-heading">{storeTitle}</h2>
          <p>{storeSubtitle}</p>
        </div>
        <Suspense>
          <ProductGrid initialProducts={initialProducts} />
        </Suspense>
      </div>
    </section>
  )
}
