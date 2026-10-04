# ICYACUMI

Contemporary luxury streetwear inspired by art, craftsmanship, and modern cultural experimentation. **MADE IN AFREEKA.** Built with Next.js.

Small-batch apparel — heavyweight canvas, selvedge denim, garment-dyed fleece — with SEO-friendly product pages, image optimization, a persistent bag, and XentriPay checkout (MoMo + card).

## Stack

- **Next.js 16** (App Router) — SSR/SSG for SEO, `next/image` for product photos
- **TypeScript** + **Tailwind CSS 4**
- **Local seed catalog** — swap for a database or CMS later without touching pages
- **XentriPay** — MTN MoMo, Airtel Money, and card collections (RWF)

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
| `/search` | Crawlable marketplace search results |
| `/checkout/pay` | MTN MoMo, Airtel Money, or card via XentriPay |
| `/checkout/success` | Post-payment confirmation |
| `/about` | Brand story |
| `/sizing` | Size guide |
| `/api/catalog/payments/initiate` | Starts a XentriPay collection |

Also: `sitemap.xml`, `robots.txt`, web manifest, Open Graph metadata, and JSON-LD (Organization, WebSite SearchAction, Product, Event, Brand, BreadcrumbList) for search engines.

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

## Enabling XentriPay

Storefront checkout uses XentriPay collections (MoMo + card). The API key stays on the backend only.

1. Copy `backend/.env.example` → `backend/.env`.
2. Add your merchant key from the [XentriPay dashboard](https://merchant.test.xentripay.com):

```env
XENTRIPAY_API_KEY=your_key
XENTRIPAY_BASE_URL=https://merchant.test.xentripay.com
FRONTEND_URL=http://localhost:3000
```

3. Restart the backend, add something to the bag, and pay with MTN, Airtel, or card.

Without a key, checkout returns a clear error instead of marking the order paid. Amounts are whole RWF (minimum 100). MoMo sends a phone prompt; card redirects to the XentriPay/Urubuto page. The order is created only after collection status is `SUCCESS`.

For production, set `XENTRIPAY_BASE_URL=https://xentripay.com` and `FRONTEND_URL` / `NEXT_PUBLIC_SITE_URL` to your live domain.

## Search engines (SEO)

Set `NEXT_PUBLIC_SITE_URL` to your live domain so canonical URLs, Open Graph, sitemap, and robots resolve correctly.

After deploy:

1. Open `/robots.txt` and `/sitemap.xml` and confirm they use your domain.
2. In [Google Search Console](https://search.google.com/search-console), add the property and submit `https://your-domain/sitemap.xml`.
3. Optionally do the same in Bing Webmaster Tools.

Structured data is emitted for Organization, WebSite (with SearchAction → `/search?q=`), Product, Event, Brand, BreadcrumbList, and CollectionPage.

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
- Confirm XentriPay live keys and `FRONTEND_URL` on production
- Wire the footer newsletter form to Klaviyo / Resend / Mailchimp
- Replace Unsplash stand-ins with your own product photography
