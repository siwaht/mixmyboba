# Cellulalabs — Research Peptide E-Commerce

## Project Overview
Research peptide e-commerce site for Cellulalabs. Next.js 16.2.2 (App Router), React 19, SQLite/Prisma, JWT auth. Migrated from Vercel to Replit.

## Tech Stack
- **Framework**: Next.js 16.2.2 with Turbopack dev server
- **Runtime**: React 19
- **Database**: SQLite via `@prisma/adapter-better-sqlite3` (env: `SQLITE_URL=file:./prisma/dev.db`)
- **Auth**: JWT — secret from `JWT_SECRET` env var (fallback: `cellulalabs-dev-secret-change-in-prod`)
- **Styling**: Plain CSS custom properties in `src/app/globals.css` (2600+ lines)
- **Icons**: `lucide-react`
- **Fonts**: Inter + Outfit via `next/font/google`
- **Port**: 5000 on `0.0.0.0`

## Design System — Quiet Dark
Calm, sophisticated dark aesthetic (graduated from mockup sandbox in April 2026):
- **Background**: `#0d0d0d` primary, `#111111` secondary
- **Accent**: `#d4b896` (warm cream/sand — replaces old gold `#c9a24e`)
- **Text**: `#e0e0e0` primary, `rgba(255,255,255,0.4)` secondary
- **Borders**: `rgba(255,255,255,0.05)`
- **No** animated glows, glow blobs, gradient buttons, or shimmer effects
- Heading font-weight: 300 (light)
- CTAs: flat solid background, uppercase tracking-wide, no border-radius

## Key Files
- `src/app/layout.tsx` — Root layout (Navbar, ComplianceBanner, Toast, footer)
- `src/app/page.tsx` — Homepage (hero, stats bar, features, product grid, process, CTA)
- `src/app/globals.css` — All design tokens and component CSS
- `src/components/Navbar.tsx` — Sticky nav with lucide ShoppingCart, uppercase links
- `src/components/ProductGrid.tsx` — Category filters + search + product cards
- `src/components/ProductCard.tsx` — Individual product card
- `src/lib/db.ts` — SQLite Prisma client (uses SQLITE_URL, NOT DATABASE_URL)
- `src/lib/auth.ts` — JWT auth logic
- `prisma/schema.prisma` — Database schema

## Important Notes
- **Database**: App uses `SQLITE_URL` env var. Replit also injects `DATABASE_URL` pointing to Postgres — do NOT use it.
- **Node version**: Replit runs Node v20. `@prisma/streams-local` warning about Node ≥22 is non-breaking.
- **Mockup sandbox**: Running at port 23636 / `/__mockup/`. Three design variants preserved in `artifacts/mockup-sandbox/src/components/mockups/cellula-homepage/`.
- **Theme**: App defaults to light. Dark theme available via toggle.

## Architecture
- App Router with server components by default
- Client components use `'use client'` directive
- Cart state: Zustand (`src/lib/cartStore.ts`)
- Toast notifications: custom store (`src/components/Toast.tsx`)
- Product images served from external URLs stored in DB
