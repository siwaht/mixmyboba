# Mix My Boba — Premium Instant Boba Tea E-Commerce

## Project Overview
E-commerce site for Mix My Boba — premium instant boba tea mixes. Next.js 16 (App Router), React 19, SQLite/Prisma, JWT auth, deployed on Replit.

## Tech Stack
- **Framework**: Next.js 16.2.3 with Webpack dev server
- **Runtime**: React 19
- **Database**: SQLite via `@prisma/adapter-better-sqlite3` (env: `SQLITE_URL=file:./prisma/dev.db`)
- **Auth**: JWT — secret from `JWT_SECRET` env var
- **Styling**: Plain CSS custom properties in `src/app/globals.css`
- **Icons**: `lucide-react`
- **Fonts**: Inter + Outfit via `next/font/google`
- **Port**: 5000 on `0.0.0.0`

## Products (8 Flavors)
All products use real JPG product photos stored in `public/products/`:
1. Classic Milk Tea (`classic-milk-tea.jpg`) — $24.99
2. Taro Milk Tea (`taro.jpg`) — $26.99
3. Matcha Boba (`matcha.jpg`) — $27.99
4. Brown Sugar Boba (`brown-sugar.jpg`) — $26.99
5. Thai Tea (`thai-tea.jpg`) — $25.99
6. Honeydew Milk Tea (`honeydew.jpg`) — $25.99
7. Strawberry Milk Tea (`strawberry.jpg`) — $25.99
8. Passion Fruit Boba (`passion-fruit.jpg`) — $26.99

Categories: Classic, Matcha, Brown Sugar, Fruity

## Key Files
- `src/app/layout.tsx` — Root layout (Navbar, Toast, footer)
- `src/app/page.tsx` — Homepage (hero, stats bar, features, product grid, process, CTA)
- `src/app/globals.css` — All design tokens and component CSS
- `src/components/Navbar.tsx` — Sticky nav with cart
- `src/components/ProductGrid.tsx` — Category filters + search + product cards
- `src/components/ProductCard.tsx` — Individual product card
- `src/lib/db.ts` — SQLite Prisma client (uses SQLITE_URL, NOT DATABASE_URL)
- `src/lib/auth.ts` — JWT auth logic
- `prisma/schema.prisma` — Database schema
- `prisma/seed.ts` — Database seeder (8 products, customers, reviews, orders)
- `prisma/replace-products.ts` — Script to replace products with real images
- `next.config.ts` — Next.js config (images unoptimized for local JPGs)

## Important Notes
- **Database**: App uses `SQLITE_URL` env var. Replit also injects `DATABASE_URL` pointing to Postgres — do NOT use it.
- **Images**: Product images are unoptimized (`images.unoptimized: true` in next.config.ts) to serve local JPGs directly from `public/products/`.
- **Node version**: Replit runs Node v20. `@prisma/streams-local` warning about Node >= 22 is non-breaking.

## Architecture
- App Router with server components by default
- Client components use `'use client'` directive
- Cart state: Zustand (`src/lib/cartStore.ts`)
- Toast notifications: custom store (`src/components/Toast.tsx`)
- Product images served from `/public/products/` as local JPGs
- Admin dashboard at `/admin`
