# BONE KOBOYI

Contemporary luxury streetwear inspired by art, craftsmanship, and modern cultural experimentation. **MADE IN AFREEKA.** Built with Next.js.

Small-batch apparel — heavyweight canvas, selvedge denim, garment-dyed fleece — with SEO-friendly product pages, image optimization, a persistent bag, and a Stripe-ready checkout.

## Stack

- **Next.js 16** (App Router) — SSR/SSG for SEO, `next/image` for product photos
- **TypeScript** + **Tailwind CSS 4**
- **Local seed catalog** — swap for a database or CMS later without touching pages
- **Stripe Checkout** — wired via a route handler; no SDK required to start

## Getting started

```bash
npm install
npm run images:real   # download Unsplash product & scene photos
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What's included

| Route | Purpose |
| --- | --- |
| `/` | Home — hero, featured products, collections |
| `/shop` | Catalog with collection / category / size / colour / sort filters |
| `/shop/[slug]` | Product detail with size & colour picker, JSON-LD, related pieces |
| `/cart` | Bag with quantity controls and checkout |
| `/checkout/success` | Post-payment confirmation |
| `/about` | Brand story |
| `/sizing` | Size guide |
| `/api/checkout` | Creates a Stripe Checkout Session |

Also: `sitemap.xml`, `robots.txt`, and Open Graph metadata on every product.

## Project layout

```
src/
  app/                 # Routes (App Router)
  components/          # UI + cart provider
  data/catalog.ts      # Seed product data
  lib/                 # Types, product accessors, money helpers, site config
public/
  products/            # Product photography (4:5)
  scenes/              # Editorial / hero art
scripts/
  generate-product-images.mjs
```

Product data lives in `src/data/catalog.ts`. Everything else reads it through `src/lib/products.ts`, so replacing the seed with Postgres, Sanity, Shopify, etc. only means rewriting that one module.

## Enabling Stripe

1. Copy `.env.example` → `.env.local` (a starter file is already there).
2. Add a test secret key from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys):

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
```

3. Restart `npm run dev`, add something to the bag, and hit **Proceed to checkout**.

Without a key, checkout returns a clear 503 explaining what's missing instead of failing silently.

Prices are looked up **server-side** from the catalog. The browser only sends product IDs, size, colour and quantity — never a price.

For production, set `NEXT_PUBLIC_SITE_URL` to your live domain so Stripe success/cancel redirects and product images resolve correctly.

## Photography

Product and scene images are real Unsplash photos (`npm run images:real`), free under the Unsplash License. Drop your own studio shots into `public/products/` using the same filenames (`{slug}-1.jpg`, `{slug}-2.jpg`, 4:5 ratio) and the storefront picks them up with no code changes.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run images:real` | Download Unsplash product & scene photos |
| `npm run images` | Regenerate abstract placeholder PNGs |

## Next steps when you're ready

- Point `src/lib/products.ts` at a real database or headless CMS
- Add a Stripe webhook at `/api/webhooks/stripe` to record paid orders
- Wire the footer newsletter form to Klaviyo / Resend / Mailchimp
- Replace Unsplash stand-ins with your own product photography
