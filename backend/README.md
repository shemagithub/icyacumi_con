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

Credentials match `backend/.env` (`root` @ `localhost:3306`, empty password by default).

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
