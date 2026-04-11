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
    description: 'The OG. Bold, malty black tea with a smooth, creamy finish. The flavor that started it all — rich, comforting, and endlessly sippable. Just like your favorite boba shop, minus the line.',
    imageUrl: '/products/classic-milk-tea.svg',
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
    imageUrl: '/products/taro-milk-tea.svg',
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
    ],
  },
  {
    slug: 'matcha-latte',
    name: 'Matcha Latte',
    price: 27.99,
    description: 'Ceremonial-grade matcha meets creamy milk tea magic. Earthy, smooth, and lightly sweet with a clean energy boost. No jitters, just vibes. Perfect hot or over ice.',
    imageUrl: '/products/matcha-latte.svg',
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
    ],
  },
  {
    slug: 'brown-sugar-boba',
    name: 'Brown Sugar Boba',
    price: 26.99,
    description: 'Rich, caramelized brown sugar swirled into velvety milk tea. That tiger stripe aesthetic in every cup. Sweet, toasty, and absolutely craveable. The TikTok favorite for a reason.',
    imageUrl: '/products/brown-sugar-boba.svg',
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
    ],
  },
  {
    slug: 'thai-tea',
    name: 'Thai Tea',
    price: 25.99,
    description: 'Bold, spiced Ceylon tea with a creamy orange hue. Sweet, aromatic, and unmistakably Thai. The sunset-colored drink that tastes like a tropical vacation in every sip.',
    imageUrl: '/products/thai-tea.svg',
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
    ],
  },
  {
    slug: 'honeydew-milk-tea',
    name: 'Honeydew Milk Tea',
    price: 25.99,
    description: 'Light, refreshing, and naturally sweet with real honeydew melon flavor. A fruity twist on classic milk tea that tastes like summer year-round. Perfect over ice.',
    imageUrl: '/products/honeydew-milk-tea.svg',
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
    imageUrl: '/products/strawberry-milk-tea.svg',
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
    slug: 'mango-passion-fruit',
    name: 'Mango Passion Fruit',
    price: 26.99,
    description: 'Tropical mango meets tangy passion fruit in a creamy milk tea base. Bright, juicy, and ridiculously refreshing. Close your eyes and you are on a beach somewhere.',
    imageUrl: '/products/mango-passion-fruit.svg',
    category: 'Fruity',
    purity: '20+ Servings',
    stock: 160,
    storageTemp: 'Cool & Dry',
    form: 'Instant Powder Mix',
    batchNumber: 'MPF-2026-047',
    lotNumber: 'L2026-0471',
    variants: [
      { label: 'Regular (250g)', price: 26.99, stock: 160 },
      { label: 'Large (500g)', price: 46.99, stock: 70 },
    ],
  },
  {
    slug: 'earl-grey-milk-tea',
    name: 'Earl Grey Milk Tea',
    price: 26.99,
    description: 'Citrusy bergamot aroma over a smooth black tea base. Sophisticated, fragrant, and perfectly balanced. London fog vibes meets boba culture. Elegant in every sip.',
    imageUrl: '/products/earl-grey-milk-tea.svg',
    category: 'Classic',
    purity: '20+ Servings',
    stock: 190,
    storageTemp: 'Cool & Dry',
    form: 'Instant Powder Mix',
    batchNumber: 'EGM-2026-036',
    lotNumber: 'L2026-0362',
    variants: [
      { label: 'Regular (250g)', price: 26.99, stock: 190 },
      { label: 'Large (500g)', price: 46.99, stock: 85 },
    ],
  },
  {
    slug: 'hojicha-roasted-tea',
    name: 'Hojicha Roasted Tea',
    price: 27.99,
    description: 'Roasted Japanese green tea with nutty depth and cocoa notes. Low caffeine, high flavor. Warm, toasty, and incredibly smooth. The cozy drink you did not know you needed.',
    imageUrl: '/products/hojicha-roasted-tea.svg',
    category: 'Matcha',
    purity: '20+ Servings',
    stock: 150,
    tag: 'new',
    storageTemp: 'Cool & Dry',
    form: 'Instant Powder Mix',
    batchNumber: 'HOJ-2026-051',
    lotNumber: 'L2026-0513',
    variants: [
      { label: 'Regular (250g)', price: 27.99, stock: 150 },
      { label: 'Large (500g)', price: 48.99, stock: 60 },
    ],
  },
  {
    slug: 'ube-milk-tea',
    name: 'Ube Milk Tea',
    price: 27.99,
    description: 'Filipino purple yam meets creamy milk tea. Sweet, earthy, and gorgeously purple. A unique flavor that is taking the boba world by storm. One sip and you will understand the hype.',
    imageUrl: '/products/ube-milk-tea.svg',
    category: 'Classic',
    purity: '20+ Servings',
    stock: 140,
    tag: 'staff_pick',
    storageTemp: 'Cool & Dry',
    form: 'Instant Powder Mix',
    batchNumber: 'UBE-2026-048',
    lotNumber: 'L2026-0485',
    variants: [
      { label: 'Regular (250g)', price: 27.99, stock: 140 },
      { label: 'Large (500g)', price: 48.99, stock: 55 },
    ],
  },
  {
    slug: 'sampler-pack',
    name: 'Flavor Sampler Pack',
    price: 34.99,
    description: 'Can not decide? Try them all. Six single-serve sachets of our most popular flavors — Classic, Taro, Matcha, Brown Sugar, Thai Tea, and Strawberry. The perfect intro to your new boba obsession.',
    imageUrl: '/products/sampler-pack.svg',
    category: 'Bundles',
    purity: '6 Servings',
    stock: 500,
    tag: 'best_seller',
    storageTemp: 'Cool & Dry',
    form: 'Single-Serve Sachets',
    batchNumber: 'SMP-2026-055',
    lotNumber: 'L2026-0552',
    variants: [
      { label: 'Sampler (6 pack)', price: 34.99, stock: 500 },
      { label: 'Party Pack (12)', price: 59.99, stock: 200 },
    ],
  },
  {
    slug: 'tapioca-pearls',
    name: 'Quick-Cook Tapioca Pearls',
    price: 12.99,
    description: 'Chewy, bouncy, perfectly sweet tapioca pearls ready in 5 minutes. The essential boba topping to complete your at-home boba experience. Pairs with every flavor we make.',
    imageUrl: '/products/tapioca-pearls.svg',
    category: 'Toppings',
    purity: '~15 Servings',
    stock: 400,
    tag: 'fast_selling',
    storageTemp: 'Cool & Dry',
    form: 'Dry Tapioca Pearls',
    batchNumber: 'TPP-2026-042',
    lotNumber: 'L2026-0428',
    variants: [
      { label: 'Regular (250g)', price: 12.99, stock: 400 },
      { label: 'Large (500g)', price: 21.99, stock: 200 },
    ],
  },
  {
    slug: 'popping-boba-mango',
    name: 'Popping Boba — Mango',
    price: 9.99,
    description: 'Juicy mango-flavored popping boba that bursts with tropical flavor in every bite. A fun, fruity topping that takes your boba game to the next level. Kids and adults love these.',
    imageUrl: '/products/popping-boba-mango.svg',
    category: 'Toppings',
    purity: '~10 Servings',
    stock: 300,
    storageTemp: 'Cool & Dry',
    form: 'Popping Boba',
    batchNumber: 'PBM-2026-031',
    lotNumber: 'L2026-0314',
    variants: [
      { label: 'Jar (450g)', price: 9.99, stock: 300 },
    ],
  },
  {
    slug: 'coconut-jelly',
    name: 'Coconut Jelly Topping',
    price: 8.99,
    description: 'Soft, chewy coconut jelly cubes with a light tropical sweetness. A refreshing alternative to tapioca pearls. Low calorie, big flavor. Perfect in fruity milk teas.',
    imageUrl: '/products/coconut-jelly.svg',
    category: 'Toppings',
    purity: '~10 Servings',
    stock: 250,
    storageTemp: 'Cool & Dry',
    form: 'Jelly Cubes',
    batchNumber: 'CJT-2026-022',
    lotNumber: 'L2026-0226',
    variants: [
      { label: 'Jar (450g)', price: 8.99, stock: 250 },
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
  { rating: 5, title: 'The earl grey is ELITE', body: 'London fog meets boba and I am here for it. The bergamot flavor is so fragrant and the tea base is clearly real tea. Sophisticated and delicious.' },
  { rating: 4, title: 'Great value for the servings', body: 'At less than $2 a cup this is a no-brainer. I was spending $50+ a week on boba runs. Now I spend that in a month and drink it every day.' },
  { rating: 5, title: 'Perfect with the tapioca pearls', body: 'Ordered the classic milk tea + tapioca pearls combo. The pearls cook in 5 min and the whole thing tastes like a legit boba shop drink. So satisfying.' },
  { rating: 5, title: 'Finally a clean boba option', body: 'No artificial colors or flavors?? And it still tastes THIS good?? Take my money. I have been looking for something like this forever.' },
  { rating: 5, title: 'The hojicha flavor is incredible', body: 'Roasty, nutty, low caffeine — perfect for evenings. I make it warm with oat milk and it is the coziest drink ever. New comfort drink unlocked.' },
  { rating: 4, title: 'Wish I found this sooner', body: 'Been making boba at home with other brands and this is by far the best tasting one. Real tea flavor, not chalky at all. Very impressed.' },
  { rating: 5, title: 'Subscribe and save is clutch', body: 'Set up a monthly subscription and never worry about running out. The 20% discount on subscribe makes it even more of a steal. Smart move.' },
  { rating: 5, title: 'Ube flavor is a VIBE', body: 'The purple color, the sweet earthy taste, the creamy texture — this ube milk tea is everything. I feel like I am in Manila. Absolutely beautiful.' },
  { rating: 4, title: 'Mango passion fruit is refreshing', body: 'Perfect summer drink. Bright, tropical, and so refreshing over ice. Not too sweet either. Great with popping boba on top.' },
]

// ─── Coupons ─────────────────────────────────────────────────────────────────

const coupons = [
  { code: 'FIRSTSIP', type: 'percent', value: 15, minOrder: 25, maxUses: 500, usedCount: 127, active: true },
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
    { customer: customerRecords[0], productIndices: [0, 2, 12], quantities: [1, 1, 2], status: 'shipped', payment: 'card', daysAgo: 3 },
    { customer: customerRecords[1], productIndices: [3, 4], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 60 },
    { customer: customerRecords[1], productIndices: [1], quantities: [2], status: 'delivered', payment: 'card', daysAgo: 30, couponCode: 'BOBA20', discount: 10.80 },
    { customer: customerRecords[1], productIndices: [0, 7], quantities: [1, 1], status: 'paid', payment: 'card', daysAgo: 1 },
    { customer: customerRecords[2], productIndices: [2, 8], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 55 },
    { customer: customerRecords[2], productIndices: [5], quantities: [2], status: 'delivered', payment: 'card', daysAgo: 25 },
    { customer: customerRecords[2], productIndices: [0, 1, 3], quantities: [1, 1, 1], status: 'shipped', payment: 'card', daysAgo: 5, couponCode: 'BULKBOBA', discount: 11.85 },
    { customer: customerRecords[3], productIndices: [3], quantities: [2], status: 'delivered', payment: 'card', daysAgo: 40 },
    { customer: customerRecords[3], productIndices: [2, 7, 8], quantities: [1, 1, 1], status: 'delivered', payment: 'card', daysAgo: 15 },
    { customer: customerRecords[3], productIndices: [11], quantities: [1], status: 'pending', payment: 'card', daysAgo: 0 },
    { customer: customerRecords[4], productIndices: [0], quantities: [3], status: 'delivered', payment: 'card', daysAgo: 50, couponCode: 'SAVE10', discount: 10.0, notes: 'Stocking up!' },
    { customer: customerRecords[4], productIndices: [1, 6], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 22 },
    { customer: customerRecords[5], productIndices: [5, 2], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 35 },
    { customer: customerRecords[5], productIndices: [9, 10], quantities: [1, 1], status: 'shipped', payment: 'card', daysAgo: 4 },
    { customer: customerRecords[6], productIndices: [8], quantities: [2], status: 'delivered', payment: 'card', daysAgo: 28 },
    { customer: customerRecords[6], productIndices: [12, 13], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 10 },
    { customer: customerRecords[7], productIndices: [7], quantities: [2], status: 'delivered', payment: 'card', daysAgo: 42, couponCode: 'BOBAFAM', discount: 13.50 },
    { customer: customerRecords[7], productIndices: [0, 14], quantities: [1, 1], status: 'paid', payment: 'card', daysAgo: 2 },
    { customer: customerRecords[8], productIndices: [10, 11], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 38 },
    { customer: customerRecords[8], productIndices: [2, 3], quantities: [1, 1], status: 'cancelled', payment: 'card', daysAgo: 18, notes: 'Changed my mind, sorry!' },
    { customer: customerRecords[9], productIndices: [6, 7], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 48 },
    { customer: customerRecords[9], productIndices: [0, 1, 10], quantities: [1, 1, 1], status: 'delivered', payment: 'card', daysAgo: 12, couponCode: 'SIPNSAVE', discount: 8.0 },
    { customer: customerRecords[10], productIndices: [12, 13], quantities: [2, 1], status: 'shipped', payment: 'card', daysAgo: 6 },
    { customer: customerRecords[10], productIndices: [1], quantities: [2], status: 'delivered', payment: 'card', daysAgo: 33 },
    { customer: customerRecords[11], productIndices: [4, 5], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 27 },
    { customer: customerRecords[11], productIndices: [0, 3, 12], quantities: [1, 1, 2], status: 'pending', payment: 'card', daysAgo: 0 },
    // Guest orders
    { customer: { id: '', email: 'guest.boba@gmail.com', name: null }, productIndices: [0, 12], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 52 },
    { customer: { id: '', email: 'bobalover@protonmail.com', name: null }, productIndices: [11, 1], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 44 },
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
