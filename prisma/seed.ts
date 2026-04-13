import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { hashSync } from 'bcryptjs'

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' })
const prisma = new PrismaClient({ adapter })

// ─── Products ────────────────────────────────────────────────────────────────

const products = [
  {
    slug: 'classic-milk-tea',
    name: 'Classic Milk Tea',
    price: 24.99,
    description: 'The OG. Bold, malty Assam black tea with a smooth, creamy finish — sweetened with dates, not sugar. Loaded with lion\'s mane for focus and prebiotic fiber for gut health. Boba shop taste with functional benefits your body actually wants.',
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
    description: 'That iconic purple sip — made with real taro root, not artificial color. Creamy, nutty, subtly sweet with ashwagandha for stress relief and prebiotic fiber for zero bloat. Naturally sweetened with dates. Your gut and your Instagram will thank you.',
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
    description: 'Ceremonial-grade Uji matcha meets creamy milk tea magic. Earthy, smooth, and date-sweetened with lion\'s mane + reishi mushrooms for focus and immunity. Clean energy, no jitters, no crash. 137x more antioxidants than regular green tea.',
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
    description: 'Rich, caramelized depth from organic coconut sugar and blackstrap molasses — not refined white sugar. Maca root for all-day energy, cinnamon for metabolism, and prebiotic fiber for gut harmony. That tiger stripe aesthetic with functional benefits.',
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
    description: 'Bold Ceylon tea with cardamom, star anise, and a turmeric-black pepper anti-inflammatory duo. Naturally sweetened with dates, not sugar. Spiced, aromatic, and packed with vitamin C + zinc for immune defense. A sunset-colored sip that fights inflammation.',
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
    description: 'Light, refreshing, and naturally sweet with real honeydew melon powder. Infused with marine collagen for skin glow, aloe vera for gut soothing, and biotin for hair and nails. Date-sweetened, zero artificial anything. Your beauty routine in a cup.',
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
    description: 'Freeze-dried real strawberry with acerola cherry for mega-dose vitamin C and beetroot for natural pink color. Date-sweetened with prebiotic fiber for happy gut vibes. No artificial colors, no artificial flavors — just real berry goodness that hits different.',
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
    description: 'Real passion fruit with holy basil (tulsi) for calm and ginger root for digestive comfort. Date-sweetened, loaded with vitamin C and B6 + magnesium for mood support. Tangy, tropical, and ridiculously refreshing — functional wellness meets beach vibes.',
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

// ─── Customers ───────────────────────────────────────────────────────────────

const customers = [
  { email: 'sarah.c@gmail.com', name: 'Sarah C.', password: 'boba123!' },
  { email: 'james.m@outlook.com', name: 'James M.', password: 'milktea456' },
  { email: 'ananya.k@gmail.com', name: 'Ananya K.', password: 'taro789' },
  { email: 'marcus.w@yahoo.com', name: 'Marcus W.', password: 'matcha321' },
  { email: 'li.z@gmail.com', name: 'Li Z.', password: 'boba654' },
  { email: 'elena.g@hotmail.com', name: 'Elena G.', password: 'brownsugar987' },
  { email: 'rob.j@gmail.com', name: 'Rob J.', password: 'bobatea111' },
  { email: 'kavita.p@outlook.com', name: 'Kavita P.', password: 'pearls222' },
  { email: 'tom.s@gmail.com', name: 'Tom S.', password: 'chewy333' },
  { email: 'yuna.k@gmail.com', name: 'Yuna K.', password: 'tapioca444' },
  { email: 'david.b@yahoo.com', name: 'David B.', password: 'sip555' },
  { email: 'nat.w@gmail.com', name: 'Natalie W.', password: 'flavor666' },
]

// ─── Reviews Pool ────────────────────────────────────────────────────────────

const reviewPool = [
  { rating: 5, title: 'Literally tastes like the boba shop', body: 'I was skeptical but WOW. Made it with oat milk and it tastes exactly like my $8 boba order. I am never going back. This is my daily ritual now.' },
  { rating: 5, title: 'Obsessed is an understatement', body: 'I have been making this every single morning for 3 weeks straight. The taro flavor is INSANE. My roommate keeps stealing sips. Ordering the bulk size next.' },
  { rating: 4, title: 'Really good, wish there were more flavors', body: 'The quality is legit — real tea taste, not that fake powdery stuff. Would love to see a lavender or rose flavor. But what they have is solid.' },
  { rating: 5, title: 'Best purchase I have made this year', body: 'Saving so much money making boba at home. The brown sugar flavor with tapioca pearls is *chef kiss*. My whole friend group is ordering now.' },
  { rating: 4, title: 'Great taste, easy to make', body: 'Super simple — scoop, mix, done. Tastes great with almond milk. Only giving 4 stars because I wish the bag was resealable. But the flavor is 10/10.' },
  { rating: 5, title: 'My kids are OBSESSED', body: 'My 12-year-old makes her own boba every day after school now. She loves the strawberry flavor. It is actually wholesome ingredients too which I appreciate as a parent.' },
  { rating: 5, title: 'Game changer for WFH life', body: 'I used to walk 15 min to the boba shop every afternoon. Now I just make it at my desk in 60 seconds. Better for my wallet and my schedule.' },
  { rating: 5, title: 'Gifted this and everyone loved it', body: 'Bought the sampler pack as a gift for my sister. She texted me the next day asking where to order more. Now our whole family is hooked.' },
  { rating: 4, title: 'Solid quality, fast shipping', body: 'Arrived in 2 days, well packaged. The matcha flavor is smooth and not bitter at all. Will definitely reorder when I run out.' },
  { rating: 3, title: 'Good but a bit sweet for me', body: 'The flavor is authentic and the quality is there. Just a touch sweeter than I prefer. I add less powder and it is perfect. Still a great product overall.' },
  { rating: 5, title: 'Better than the boba shop honestly', body: 'I can customize it exactly how I want — less sweet, extra creamy with coconut milk. It is actually better than what I get at shops because it is MY way.' },
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

// ─── Coupons ─────────────────────────────────────────────────────────────────

const coupons = [
  { code: 'FIRSTSIP', type: 'percent', value: 15, minOrder: 0, maxUses: 500, usedCount: 127, active: true },
  { code: 'BOBA20', type: 'percent', value: 20, minOrder: 50, maxUses: 200, usedCount: 89, active: true },
  { code: 'SAVE10', type: 'fixed', value: 10, minOrder: 40, active: true },
  { code: 'BULKBOBA', type: 'percent', value: 15, minOrder: 100, active: true },
  { code: 'SUMMER26', type: 'percent', value: 18, minOrder: 60, maxUses: 100, usedCount: 34, active: true, expiresAt: new Date('2026-09-30') },
  { code: 'FREESHIP', type: 'fixed', value: 5.99, minOrder: 35, active: true },
  { code: 'BOBAFAM', type: 'percent', value: 25, minOrder: 75, maxUses: 50, usedCount: 12, active: true },
  { code: 'SIPNSAVE', type: 'fixed', value: 8, minOrder: 30, maxUses: 300, usedCount: 156, active: true },
]

// ─── Addresses ───────────────────────────────────────────────────────────────

const addresses = [
  '123 Maple St, Apt 4B, Brooklyn, NY 11201',
  '456 Sunset Blvd, Los Angeles, CA 90028',
  '789 Michigan Ave, Unit 12, Chicago, IL 60611',
  '321 Pearl St, Austin, TX 78701',
  '555 Market St, San Francisco, CA 94105',
  '100 Peachtree Rd, Atlanta, GA 30309',
  '250 Commonwealth Ave, Boston, MA 02116',
  '800 Pike St, Apt 7, Seattle, WA 98101',
  '1200 NW 23rd Ave, Portland, OR 97210',
  '75 South St, Miami, FL 33130',
  '400 Hennepin Ave, Minneapolis, MN 55401',
  '600 H St NW, Washington, DC 20001',
]

// ─── Main Seed Function ─────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...')

  // ── Admin user ──
  const admin = await prisma.user.upsert({
    where: { email: 'cc@siwaht.com' },
    update: {},
    create: {
      email: 'cc@siwaht.com',
      password: hashSync('Hola173!', 12),
      name: 'Admin',
      role: 'admin',
    },
  })
  console.log('  ✓ Admin user')

  // ── Customer users ──
  const customerRecords: Array<{ id: string; email: string; name: string | null }> = []
  for (const c of customers) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        password: hashSync(c.password, 12),
        name: c.name,
        role: 'customer',
      },
    })
    customerRecords.push({ id: user.id, email: user.email, name: user.name })
  }
  console.log(`  ✓ ${customerRecords.length} customers`)

  // ── Products with variants ──
  const productRecords: Array<{ id: string; slug: string; price: number; name: string }> = []
  for (const { variants, ...productData } of products) {
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: productData,
      create: productData,
    })
    productRecords.push({ id: product.id, slug: product.slug, price: product.price, name: product.name })

    // Recreate variants
    await prisma.productVariant.deleteMany({ where: { productId: product.id } })
    for (const v of variants) {
      await prisma.productVariant.create({
        data: { ...v, productId: product.id },
      })
    }
  }
  console.log(`  ✓ ${productRecords.length} products with variants`)

  // ── Reviews (spread across all products and customers) ──
  await prisma.review.deleteMany({})
  let reviewIdx = 0
  for (let pIdx = 0; pIdx < productRecords.length; pIdx++) {
    const reviewCount = 3 + (pIdx % 4) // 3, 4, 5, 6, 3, 4, ...
    for (let r = 0; r < reviewCount; r++) {
      const customerIdx = (pIdx * 3 + r) % customerRecords.length
      const review = reviewPool[reviewIdx % reviewPool.length]
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
      reviewIdx++
    }
  }
  console.log(`  ✓ ${reviewIdx} reviews`)

  // ── Coupons ──
  await prisma.coupon.deleteMany({})
  await prisma.coupon.createMany({ data: coupons })
  console.log(`  ✓ ${coupons.length} coupons`)

  // ── Orders ──
  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})

  const orderData: Array<{
    customer: typeof customerRecords[0]
    productIndices: number[]
    quantities: number[]
    status: string
    payment: string
    daysAgo: number
    couponCode?: string
    discount?: number
    notes?: string
  }> = [
    { customer: customerRecords[0], productIndices: [0, 1], quantities: [2, 1], status: 'delivered', payment: 'card', daysAgo: 45, notes: 'Love the classic!' },
    { customer: customerRecords[0], productIndices: [3], quantities: [1], status: 'delivered', payment: 'card', daysAgo: 20, couponCode: 'FIRSTSIP', discount: 4.05 },
    { customer: customerRecords[0], productIndices: [0, 2], quantities: [1, 1], status: 'shipped', payment: 'card', daysAgo: 3 },
    { customer: customerRecords[1], productIndices: [3, 4], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 60 },
    { customer: customerRecords[1], productIndices: [1], quantities: [2], status: 'delivered', payment: 'card', daysAgo: 30, couponCode: 'BOBA20', discount: 10.80 },
    { customer: customerRecords[1], productIndices: [0, 7], quantities: [1, 1], status: 'paid', payment: 'card', daysAgo: 1 },
    { customer: customerRecords[2], productIndices: [2, 5], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 55 },
    { customer: customerRecords[2], productIndices: [5], quantities: [2], status: 'delivered', payment: 'card', daysAgo: 25 },
    { customer: customerRecords[2], productIndices: [0, 1, 3], quantities: [1, 1, 1], status: 'shipped', payment: 'card', daysAgo: 5, couponCode: 'BULKBOBA', discount: 11.85 },
    { customer: customerRecords[3], productIndices: [3], quantities: [2], status: 'delivered', payment: 'card', daysAgo: 40 },
    { customer: customerRecords[3], productIndices: [2, 7], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 15 },
    { customer: customerRecords[3], productIndices: [6], quantities: [1], status: 'pending', payment: 'card', daysAgo: 0 },
    { customer: customerRecords[4], productIndices: [0], quantities: [3], status: 'delivered', payment: 'card', daysAgo: 50, couponCode: 'SAVE10', discount: 10.0, notes: 'Stocking up!' },
    { customer: customerRecords[4], productIndices: [1, 6], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 22 },
    { customer: customerRecords[5], productIndices: [5, 2], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 35 },
    { customer: customerRecords[5], productIndices: [4, 7], quantities: [1, 1], status: 'shipped', payment: 'card', daysAgo: 4 },
    { customer: customerRecords[6], productIndices: [6], quantities: [2], status: 'delivered', payment: 'card', daysAgo: 28 },
    { customer: customerRecords[6], productIndices: [0, 1], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 10 },
    { customer: customerRecords[7], productIndices: [7], quantities: [2], status: 'delivered', payment: 'card', daysAgo: 42, couponCode: 'BOBAFAM', discount: 13.50 },
    { customer: customerRecords[7], productIndices: [0, 5], quantities: [1, 1], status: 'paid', payment: 'card', daysAgo: 2 },
    { customer: customerRecords[8], productIndices: [4, 6], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 38 },
    { customer: customerRecords[8], productIndices: [2, 3], quantities: [1, 1], status: 'cancelled', payment: 'card', daysAgo: 18, notes: 'Changed my mind, sorry!' },
    { customer: customerRecords[9], productIndices: [6, 7], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 48 },
    { customer: customerRecords[9], productIndices: [0, 1, 5], quantities: [1, 1, 1], status: 'delivered', payment: 'card', daysAgo: 12, couponCode: 'SIPNSAVE', discount: 8.0 },
    { customer: customerRecords[10], productIndices: [3, 7], quantities: [2, 1], status: 'shipped', payment: 'card', daysAgo: 6 },
    { customer: customerRecords[10], productIndices: [1], quantities: [2], status: 'delivered', payment: 'card', daysAgo: 33 },
    { customer: customerRecords[11], productIndices: [4, 5], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 27 },
    { customer: customerRecords[11], productIndices: [0, 3, 6], quantities: [1, 1, 2], status: 'pending', payment: 'card', daysAgo: 0 },
    { customer: { id: '', email: 'guest.boba@gmail.com', name: null }, productIndices: [0, 2], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 52 },
    { customer: { id: '', email: 'bobalover@protonmail.com', name: null }, productIndices: [5, 1], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 44 },
  ]

  let orderCount = 0
  for (const o of orderData) {
    const validItems = o.productIndices.every(idx => idx < productRecords.length)
    if (!validItems) {
      console.warn(`  ⚠ Skipping order ${orderCount} — product index out of range`)
      orderCount++
      continue
    }

    const items = o.productIndices.map((pIdx, i) => ({
      productId: productRecords[pIdx].id,
      quantity: o.quantities[i],
      price: productRecords[pIdx].price,
      variantLabel: products[pIdx].variants[0]?.label || null,
    }))
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const discount = o.discount || 0
    const total = Math.max(0, subtotal - discount)

    await prisma.order.create({
      data: {
        userId: o.customer.id || undefined,
        email: o.customer.email,
        status: o.status,
        paymentMethod: o.payment,
        paymentRef: o.status !== 'pending' ? `PAY-${Date.now().toString(36).toUpperCase()}-${orderCount}` : null,
        shippingAddress: addresses[orderCount % addresses.length],
        subtotal: Math.round(subtotal * 100) / 100,
        total: Math.round(total * 100) / 100,
        discount,
        couponCode: o.couponCode || null,
        notes: o.notes || null,
        createdAt: new Date(Date.now() - o.daysAgo * 86400000),
        updatedAt: new Date(Date.now() - Math.max(0, o.daysAgo - 2) * 86400000),
        items: {
          create: items,
        },
      },
    })
    orderCount++
  }
  console.log(`  ✓ ${orderCount} orders`)

  console.log('\n✅ Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
