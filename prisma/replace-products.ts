import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' })
const prisma = new PrismaClient({ adapter })

const newProducts = [
  {
    slug: 'classic-milk-tea',
    name: 'Classic Milk Tea',
    price: 24.99,
    description: 'The OG. Bold, malty black tea with a smooth, creamy finish. The flavor that started it all — rich, comforting, and endlessly sippable. Just like your favorite boba shop, minus the line.',
    imageUrl: '/products/classic-milk-tea.jpg',
    category: 'Classic',
    purity: '20+ Servings',
    stock: 300,
    tag: 'best_seller',
    storageTemp: 'Cool & Dry',
    form: 'Instant Powder Mix',
    batchNumber: 'CLM-2026-041',
    lotNumber: 'L2026-0412',
    variants: [
      { label: 'Regular (250g)', price: 24.99, stock: 300 },
      { label: 'Large (500g)', price: 42.99, stock: 150 },
      { label: 'Bulk (1kg)', price: 74.99, stock: 50 },
    ],
  },
  {
    slug: 'taro-milk-tea',
    name: 'Taro Milk Tea',
    price: 26.99,
    description: 'That iconic purple sip. Creamy, nutty, subtly sweet with real taro root flavor. Smooth vanilla undertones make this one dangerously addictive. Your Instagram will thank you.',
    imageUrl: '/products/taro.jpg',
    category: 'Classic',
    purity: '20+ Servings',
    stock: 250,
    tag: 'popular',
    storageTemp: 'Cool & Dry',
    form: 'Instant Powder Mix',
    batchNumber: 'TAR-2026-038',
    lotNumber: 'L2026-0389',
    variants: [
      { label: 'Regular (250g)', price: 26.99, stock: 250 },
      { label: 'Large (500g)', price: 46.99, stock: 120 },
      { label: 'Bulk (1kg)', price: 79.99, stock: 40 },
    ],
  },
  {
    slug: 'matcha-boba',
    name: 'Matcha Boba',
    price: 27.99,
    description: 'Ceremonial-grade matcha meets creamy milk tea magic. Earthy, smooth, and lightly sweet with a clean energy boost. No jitters, just vibes. Perfect hot or over ice.',
    imageUrl: '/products/matcha.jpg',
    category: 'Matcha',
    purity: '20+ Servings',
    stock: 200,
    tag: 'staff_pick',
    storageTemp: 'Cool & Dry',
    form: 'Instant Powder Mix',
    batchNumber: 'MAT-2026-029',
    lotNumber: 'L2026-0291',
    variants: [
      { label: 'Regular (250g)', price: 27.99, stock: 200 },
      { label: 'Large (500g)', price: 48.99, stock: 100 },
      { label: 'Bulk (1kg)', price: 84.99, stock: 30 },
    ],
  },
  {
    slug: 'brown-sugar-boba',
    name: 'Brown Sugar Boba',
    price: 26.99,
    description: 'Rich, caramelized brown sugar swirled into velvety milk tea. That tiger stripe aesthetic in every cup. Sweet, toasty, and absolutely craveable. The TikTok favorite for a reason.',
    imageUrl: '/products/brown-sugar.jpg',
    category: 'Brown Sugar',
    purity: '20+ Servings',
    stock: 280,
    tag: 'fast_selling',
    storageTemp: 'Cool & Dry',
    form: 'Instant Powder Mix',
    batchNumber: 'BSB-2026-044',
    lotNumber: 'L2026-0445',
    variants: [
      { label: 'Regular (250g)', price: 26.99, stock: 280 },
      { label: 'Large (500g)', price: 46.99, stock: 140 },
      { label: 'Bulk (1kg)', price: 79.99, stock: 50 },
    ],
  },
  {
    slug: 'thai-tea',
    name: 'Thai Tea',
    price: 25.99,
    description: 'Bold, spiced Ceylon tea with a creamy orange hue. Sweet, aromatic, and unmistakably Thai. The sunset-colored drink that tastes like a tropical vacation in every sip.',
    imageUrl: '/products/thai-tea.jpg',
    category: 'Classic',
    purity: '20+ Servings',
    stock: 220,
    storageTemp: 'Cool & Dry',
    form: 'Instant Powder Mix',
    batchNumber: 'THT-2026-033',
    lotNumber: 'L2026-0336',
    variants: [
      { label: 'Regular (250g)', price: 25.99, stock: 220 },
      { label: 'Large (500g)', price: 44.99, stock: 100 },
      { label: 'Bulk (1kg)', price: 76.99, stock: 35 },
    ],
  },
  {
    slug: 'honeydew-milk-tea',
    name: 'Honeydew Milk Tea',
    price: 25.99,
    description: 'Light, refreshing, and naturally sweet with real honeydew melon flavor. A fruity twist on classic milk tea that tastes like summer year-round. Perfect over ice with fresh mint.',
    imageUrl: '/products/honeydew.jpg',
    category: 'Fruity',
    purity: '20+ Servings',
    stock: 180,
    storageTemp: 'Cool & Dry',
    form: 'Instant Powder Mix',
    batchNumber: 'HDM-2026-021',
    lotNumber: 'L2026-0218',
    variants: [
      { label: 'Regular (250g)', price: 25.99, stock: 180 },
      { label: 'Large (500g)', price: 44.99, stock: 80 },
    ],
  },
  {
    slug: 'strawberry-milk-tea',
    name: 'Strawberry Milk Tea',
    price: 25.99,
    description: 'Sweet, berry-forward, and perfectly pink. Real strawberry flavor blended with creamy milk tea for a fruity sip that hits different. A crowd-pleaser every single time.',
    imageUrl: '/products/strawberry.jpg',
    category: 'Fruity',
    purity: '20+ Servings',
    stock: 200,
    tag: 'new',
    storageTemp: 'Cool & Dry',
    form: 'Instant Powder Mix',
    batchNumber: 'STR-2026-015',
    lotNumber: 'L2026-0152',
    variants: [
      { label: 'Regular (250g)', price: 25.99, stock: 200 },
      { label: 'Large (500g)', price: 44.99, stock: 90 },
    ],
  },
  {
    slug: 'passion-fruit-boba',
    name: 'Passion Fruit Boba',
    price: 26.99,
    description: 'Tangy, tropical passion fruit in a lightly sweetened boba base. Bright, juicy, and ridiculously refreshing. Just add water and close your eyes — you are on a beach somewhere.',
    imageUrl: '/products/passion-fruit.jpg',
    category: 'Fruity',
    purity: '20+ Servings',
    stock: 160,
    tag: 'new',
    storageTemp: 'Cool & Dry',
    form: 'Instant Powder Mix',
    batchNumber: 'PFB-2026-047',
    lotNumber: 'L2026-0471',
    variants: [
      { label: 'Regular (250g)', price: 26.99, stock: 160 },
      { label: 'Large (500g)', price: 46.99, stock: 70 },
    ],
  },
]

const reviewPool = [
  { rating: 5, title: 'Literally tastes like the boba shop', body: 'I was skeptical but WOW. Made it with oat milk and it tastes exactly like my $8 boba order. I am never going back. This is my daily ritual now.' },
  { rating: 5, title: 'Obsessed is an understatement', body: 'I have been making this every single morning for 3 weeks straight. The taro flavor is INSANE. My roommate keeps stealing sips. Ordering the bulk size next.' },
  { rating: 4, title: 'Really good, wish there were more flavors', body: 'The quality is legit — real tea taste, not that fake powdery stuff. Would love to see a lavender or rose flavor. But what they have is solid.' },
  { rating: 5, title: 'Best purchase I have made this year', body: 'Saving so much money making boba at home. The brown sugar flavor with tapioca pearls is chef kiss. My whole friend group is ordering now.' },
  { rating: 4, title: 'Great taste, easy to make', body: 'Super simple — scoop, mix, done. Tastes great with almond milk. Only giving 4 stars because I wish the bag was resealable. But the flavor is 10/10.' },
  { rating: 5, title: 'My kids are OBSESSED', body: 'My 12-year-old makes her own boba every day after school now. She loves the strawberry flavor. Wholesome ingredients which I appreciate as a parent.' },
  { rating: 5, title: 'Game changer for WFH life', body: 'I used to walk 15 min to the boba shop every afternoon. Now I just make it at my desk in 60 seconds. Better for my wallet and my schedule.' },
  { rating: 5, title: 'Gifted this and everyone loved it', body: 'Bought the sampler as a gift for my sister. She texted me the next day asking where to order more. Now our whole family is hooked.' },
  { rating: 4, title: 'Solid quality, fast shipping', body: 'Arrived in 2 days, well packaged. The matcha flavor is smooth and not bitter at all. Will definitely reorder when I run out.' },
  { rating: 3, title: 'Good but a bit sweet for me', body: 'The flavor is authentic and the quality is there. Just a touch sweeter than I prefer. I add less powder and it is perfect. Still a great product overall.' },
  { rating: 5, title: 'Better than the boba shop honestly', body: 'I can customize it exactly how I want — less sweet, extra creamy with coconut milk. Actually better than shops because it is MY way.' },
  { rating: 5, title: 'The thai tea is ELITE', body: 'Spiced, creamy, that gorgeous orange color — I am obsessed. The flavor is so fragrant and the base is clearly real tea. Sophisticated and delicious.' },
  { rating: 4, title: 'Great value for the servings', body: 'At less than $2 a cup this is a no-brainer. I was spending $50+ a week on boba runs. Now I spend that in a month and drink it every day.' },
  { rating: 5, title: 'Passion fruit is incredible', body: 'Bright, tropical, tangy — this passion fruit boba is everything I wanted. So refreshing over ice. New summer staple for sure.' },
  { rating: 5, title: 'Finally a clean boba option', body: 'No artificial colors or flavors and it still tastes THIS good? Take my money. I have been looking for something like this forever.' },
  { rating: 5, title: 'The honeydew is so refreshing', body: 'Light, sweet, naturally melon-flavored — perfect for hot days. I make it over ice with a sprig of mint and it is the best thing ever.' },
  { rating: 4, title: 'Wish I found this sooner', body: 'Been making boba at home with other brands and this is by far the best tasting one. Real tea flavor, not chalky at all. Very impressed.' },
  { rating: 5, title: 'Brown sugar is dangerous', body: 'It is too good. I make it every single day. That toasty caramel flavor is addictive. My wallet thanks me for not going to the boba shop anymore.' },
  { rating: 5, title: 'Strawberry is surprisingly good', body: 'I expected it to be artificial-tasting but it is genuinely fruity and fresh. Beautiful pink color and the flavor is spot on. Ordering the large next time.' },
  { rating: 4, title: 'Classic is a classic for a reason', body: 'Sometimes you just want the OG and this nails it. Malty, creamy, perfectly balanced. I drink it every morning instead of coffee now.' },
]

const customers = [
  { email: 'sarah.c@gmail.com', name: 'Sarah C.' },
  { email: 'james.m@outlook.com', name: 'James M.' },
  { email: 'ananya.k@gmail.com', name: 'Ananya K.' },
  { email: 'marcus.w@yahoo.com', name: 'Marcus W.' },
  { email: 'li.z@gmail.com', name: 'Li Z.' },
  { email: 'elena.g@hotmail.com', name: 'Elena G.' },
  { email: 'rob.j@gmail.com', name: 'Rob J.' },
  { email: 'kavita.p@outlook.com', name: 'Kavita P.' },
  { email: 'tom.s@gmail.com', name: 'Tom S.' },
  { email: 'yuna.k@gmail.com', name: 'Yuna K.' },
  { email: 'david.b@yahoo.com', name: 'David B.' },
  { email: 'nat.w@gmail.com', name: 'Natalie W.' },
]

async function main() {
  console.log('🔄 Replacing all products with real boba images...')

  // Delete order items first (no cascade from Product to OrderItem)
  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.review.deleteMany({})
  await prisma.product.deleteMany({})
  console.log('  ✓ Cleared old products, orders, reviews')

  // Create new products
  const productRecords: Array<{ id: string; slug: string; price: number; name: string }> = []
  for (const { variants, ...productData } of newProducts) {
    const product = await prisma.product.create({ data: productData })
    productRecords.push({ id: product.id, slug: product.slug, price: product.price, name: product.name })
    for (const v of variants) {
      await prisma.productVariant.create({ data: { ...v, productId: product.id } })
    }
  }
  console.log(`  ✓ ${productRecords.length} new products with variants & images`)

  // Fetch customer records
  const customerRecords = await prisma.user.findMany({
    where: { email: { in: customers.map(c => c.email) } },
    select: { id: true, email: true, name: true },
  })

  // Add reviews
  let reviewIdx = 0
  for (let pIdx = 0; pIdx < productRecords.length; pIdx++) {
    const reviewCount = 3 + (pIdx % 4)
    for (let r = 0; r < reviewCount; r++) {
      if (customerRecords.length === 0) break
      const customerIdx = (pIdx * 3 + r) % customerRecords.length
      const review = reviewPool[reviewIdx % reviewPool.length]
      try {
        await prisma.review.create({
          data: {
            productId: productRecords[pIdx].id,
            userId: customerRecords[customerIdx].id,
            rating: review.rating,
            title: review.title,
            body: review.body,
            verified: r < reviewCount - 1,
            createdAt: new Date(Date.now() - (reviewIdx * 3 + r) * 86400000 * 2),
          },
        })
      } catch {
        // skip duplicate review combinations
      }
      reviewIdx++
    }
  }
  console.log(`  ✓ ${reviewIdx} reviews`)

  // Recreate a few sample orders
  const addresses = [
    '123 Maple St, Apt 4B, Brooklyn, NY 11201',
    '456 Sunset Blvd, Los Angeles, CA 90028',
    '789 Michigan Ave, Unit 12, Chicago, IL 60611',
    '321 Pearl St, Austin, TX 78701',
    '555 Market St, San Francisco, CA 94105',
  ]

  const statuses = ['delivered', 'shipped', 'paid', 'pending']
  let orderCount = 0
  for (let i = 0; i < Math.min(customerRecords.length, 10); i++) {
    const customer = customerRecords[i]
    const p1 = productRecords[i % productRecords.length]
    const p2 = productRecords[(i + 1) % productRecords.length]
    const subtotal = p1.price * 1 + p2.price * 1
    const status = statuses[i % statuses.length]
    const order = await prisma.order.create({
      data: {
        userId: customer.id,
        email: customer.email,
        status,
        paymentMethod: 'card',
        shippingAddress: addresses[i % addresses.length],
        subtotal,
        total: subtotal,
        discount: 0,
        createdAt: new Date(Date.now() - i * 5 * 86400000),
        updatedAt: new Date(Date.now() - i * 5 * 86400000),
      },
    })
    await prisma.orderItem.create({ data: { orderId: order.id, productId: p1.id, quantity: 1, price: p1.price } })
    await prisma.orderItem.create({ data: { orderId: order.id, productId: p2.id, quantity: 1, price: p2.price } })
    orderCount++
  }
  console.log(`  ✓ ${orderCount} sample orders`)

  console.log('\n✅ Products replaced successfully!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
