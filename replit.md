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
- **Tests**: Vitest + fast-check (`npm test`)
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

Categories: Classic, Matcha, Brown Sugar, Fruity. Each product also has bag-size
variants (Regular / Large / Bulk) with their own price and stock.

## Pricing — read this before touching any money code
`src/lib/pricing.ts` is the **single source of truth** for every amount the store
displays or charges. It holds the purchase-option promotion (Subscribe 40% off,
One-time 20% off), rounding, coupon rules, and total composition.

`src/lib/pricing-server.ts` exposes `buildQuote()`, the only place a cart is
priced. It resolves variant prices from the database, validates product *and*
variant stock, evaluates the coupon, and returns the line items plus totals.

- `POST /api/checkout/quote` — the checkout page renders exactly what this returns
- `POST /api/orders` — persists exactly what `buildQuote` returns

Because both endpoints call the same function, the total a customer approves is
the total they are charged. **Do not compute discounts, shipping, or totals in a
component.** Import from `@/lib/pricing` instead. `src/lib/__tests__/pricing.test.ts`
locks this down with property tests and fixed golden values.

Store-level rules (free-shipping threshold, flat shipping rate, tax rate,
currency) come from `payment-settings.json` under `general`, editable from the
admin Payments tab.

## Key Files
- `src/app/layout.tsx` — Root layout (Navbar, Toast, footer)
- `src/app/page.tsx` — Homepage (hero, stats bar, features, product grid, process, CTA)
- `src/app/shop/page.tsx` — Dedicated shop listing; the canonical product-browsing route
- `src/app/globals.css` — All design tokens and component CSS
- `src/components/Navbar.tsx` — Sticky nav with cart drawer
- `src/components/ProductGrid.tsx` — Category filters (derived from the catalogue) + search
- `src/components/ProductCard.tsx` — Individual product card
- `src/lib/pricing.ts` — Isomorphic pricing rules (see above)
- `src/lib/pricing-server.ts` — `buildQuote()`; server-authoritative cart pricing
- `src/lib/db.ts` — SQLite Prisma client (uses SQLITE_URL, NOT DATABASE_URL)
- `src/lib/auth.ts` — JWT auth logic
- `src/lib/page-content-defaults.ts` — Fallback site copy for `page-content.json`
- `src/proxy.ts` — Next 16 middleware: admin route gate + CSRF origin check
- `prisma/schema.prisma` — Database schema
- `prisma/seed.ts` — Database seeder (8 products with variants, customers, reviews, orders)
- `next.config.ts` — Next.js config (images unoptimized for local JPGs)

## Admin Dashboard (`/admin`)
Twelve tabs, each backed by routes under `src/app/api/admin/**`:
Dashboard, Orders, Products, Customers, Inventory, Reviews, Payments, Coupons,
Site Content, Pages, Webhooks, MCP.

- **Products** — CRUD, CSV import/export, tag management, image upload, and a
  per-product size editor (`VariantEditor.tsx`) for variant price and stock
- **Inventory** — inline stock edits plus bulk "add to" / "set to" restocking
- **Reviews** — verify or delete customer reviews (they appear publicly and feed
  the aggregate rating in search results)
- **Orders** — status changes and manual order creation; manual orders move stock

Authorization is enforced per route (`requireAdmin()`), and `src/proxy.ts`
additionally gates the `/admin` pages by verifying the JWT at the edge.

## Order lifecycle
- Placing an order decrements both `Product.stock` and `ProductVariant.stock`
  inside one transaction, and increments the coupon's `usedCount`
- Cancelling an order returns that stock and frees the coupon redemption, guarded
  by `Order.stockRestored` so a re-cancel can't restock twice
- A product that appears in any order line cannot be hard-deleted; deactivate it
  instead, which keeps order history intact
- Guests can view their own order via `/account/orders/[id]?email=...` — the order
  id plus a matching email, rate limited

## Important Notes
- **Database**: App uses `SQLITE_URL` env var. Replit also injects `DATABASE_URL`
  pointing to Postgres — do NOT use it.
- **Images**: Product images are unoptimized (`images.unoptimized: true`) to serve
  local JPGs directly from `public/products/`.
- **No payment capture**: orders are recorded but no processor is charged. Wiring
  up Stripe is the remaining step before taking real money.
- **Node version**: Replit runs Node v20. The `@prisma/streams-local` warning
  about Node >= 22 is non-breaking.

## Architecture
- App Router with server components by default
- Client components use `'use client'` directive
- Cart state: Zustand (`src/lib/cartStore.ts`), persisted under `mixmyboba-cart`
  with a 7-day expiry. Variant selections are keyed as `productId__variantId`;
  use `buildCartItemId` / `parseCartItemId` from `@/lib/pricing`.
- Cart prices in local state are a preview only — the server re-prices at checkout
- Toast notifications: custom store (`src/components/Toast.tsx`)
- Editable site copy lives in `page-content.json` and `site-settings.json`
