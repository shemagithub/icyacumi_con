# Backend API (Express + MySQL/Prisma)

All app data is stored in MySQL database **`bone_koboyi`** — browse it in **phpMyAdmin**.  
See [DATABASE.md](./DATABASE.md) for the full table guide.

## Quick start

```bash
cd backend
npm install
npm run generate   # once after install / Prisma schema changes
npm run setup      # create/update tables + seed demo data
npm run dev        # API on :4000 (also auto-migrates if needed)
```

Optional:

```bash
npm run seed       # re-seed demo brands, products, logins
npm run db:status  # list tables + row counts (phpMyAdmin check)
```

### phpMyAdmin

1. Open `http://localhost/phpmyadmin`
2. Select database **`bone_koboyi`**
3. Open any table (e.g. `Product`, `Brand`, `Order`) → **Browse**

Credentials match `backend/.env` (`root` @ `127.0.0.1:3306`, empty password by default).

From the project root:

```bash
npm run backend          # start backend (auto-migrates)
npm run backend:seed     # seed demo data
npm run dev:all          # frontend + backend together
```

## Portal demo logins

Password for all: `brand123`

- `bone.koboyi@portal.local`
- `dust.atelier@portal.local`
- `rodeo.lab@portal.local`
- `ink.horn@portal.local`

Demo client: `client@demo.local` / `brand123`

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Create DB/tables if needed, then API with hot reload |
| `npm run start` | Create DB/tables if needed, then API once |
| `npm run setup` | Migrate deploy + seed (recommended after clone) |
| `npm run seed` | Seed demo brands, products, and logins |
| `npm run db:status` | Print MySQL tables for phpMyAdmin |
| `npm run setup:dev` | Migrate + seed (manual full setup) |
| `npm run studio` | Prisma Studio (DB UI) |

Set `SKIP_DB_MIGRATE=1` to skip auto migrate on start.

## XentriPay

Checkout collections (MTN MoMo, Airtel Money, card) run on the backend so the merchant key never reaches the browser.

```env
XENTRIPAY_API_KEY=
XENTRIPAY_BASE_URL=https://merchant.test.xentripay.com
FRONTEND_URL=http://localhost:3000
```

- `POST /api/catalog/payments/initiate` — start a collection (`pmethod` `momo` or `cc`)
- `GET /api/catalog/payments/status/:ref` — poll until `SUCCESS` / `FAILED`; creates the order only on success
- Card `redirecturl` / `returl` return to `/checkout/pay/return`

Use the test base URL while integrating. Switch to `https://xentripay.com` for live. Minimum collection is 100 RWF.
