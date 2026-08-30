# MySQL + phpMyAdmin — BONE KOBOYI

All marketplace data lives in the MySQL database **`bone_koboyi`**.  
The Express API (Prisma) creates tables via migrations and reads/writes them at runtime.

## Open in phpMyAdmin

1. Start MySQL (XAMPP / MAMP / local MySQL).
2. Open **http://localhost/phpmyadmin** (or your phpMyAdmin URL).
3. Log in (often user `root`, empty password in local XAMPP).
4. In the left sidebar, click database **`bone_koboyi`**.
5. You should see every table listed below with a short comment.

If the database is missing, from the project:

```bash
cd backend
npm run setup          # migrate deploy + seed demo rows
# or
npm run dev            # auto-creates DB + applies migrations on start
npm run seed           # fill demo brands / products / logins
npm run db:status      # print table list + comments in the terminal
```

Connection (matches `backend/.env`):

| Setting | Default |
| --- | --- |
| Host | `localhost` |
| Port | `3306` |
| User | `root` |
| Password | _(empty)_ |
| Database | `bone_koboyi` |
| URL | `mysql://root@localhost:3306/bone_koboyi` |

## Tables (what you’ll see)

| Table | What it stores |
| --- | --- |
| `Brand` | Maker / brand profiles (`/brands`) |
| `BrandUser` | Brand portal logins |
| `Client` | Shopper accounts (profile, address, bag owner) |
| `SuperAdmin` | Platform admin logins |
| `PlatformSettings` | Commission % (singleton `id = default`) |
| `Product` | Catalog products (price, sizes, images JSON, views…) |
| `Event` | Ticketed events |
| `Ad` | Ads board creatives |
| `Payout` | Brand payout requests |
| `EmailCode` | Verify / reset email codes |
| `SharedCart` | Share-bag pay links |
| `Order` | Paid orders + delivery status |
| `OrderItem` | Lines on each order |
| `_prisma_migrations` | Migration history (don’t edit) |

Hover a table name in phpMyAdmin (or open **Structure**) to see the table comment.

## Demo rows after `npm run seed`

- Brands + products + events + ads from the catalog seed  
- Portal: `bone.koboyi@portal.local` / `brand123` (and other `*.@portal.local`)  
- Client: `client@demo.local` / `brand123`  
- Admin: `admin@bonekoboyi.com` / `admin123`

New brand signups (`/brand-signup`), orders, shared carts, and clients appear in these same tables as the app runs.
