# MixMyBoba

A full-featured boba tea ordering storefront built with Next.js, Prisma (SQLite), and Tailwind CSS.

## Stack

- **Framework**: Next.js 16 (App Router, webpack mode)
- **Database**: SQLite via Prisma ORM (`prisma/dev.db`)
- **Auth**: JWT + bcrypt (cookie-based sessions)
- **Styling**: Tailwind CSS v4
- **State**: Zustand

## Running the app

```bash
npm run dev
```

Runs on port 5000. The workflow `Start application` handles this automatically.

### First-time setup (already done)

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

The seed creates:
- 1 admin user
- 12 customers
- 8 boba products with variants
- 36 reviews, 9 coupons, 30 sample orders

## Key routes

| Route | Description |
|-------|-------------|
| `/` | Storefront homepage |
| `/shop` | Product listing |
| `/cart` | Shopping cart |
| `/checkout` | Checkout flow |
| `/account` | Customer account & order history |
| `/admin` | Admin dashboard (products, orders, customers, coupons, inventory, content) |

## User preferences
