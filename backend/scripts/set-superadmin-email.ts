/**
 * Ensure the primary super admin login is icyacumiicon@gmail.com
 * and can receive password-reset emails at that address.
 *
 * Usage (from backend/): npx tsx scripts/set-superadmin-email.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client.js";

const ADMIN_EMAIL = "icyacumiicon@gmail.com";
const LEGACY_EMAIL = "admin@icyacumi.com";
const DEFAULT_PASSWORD = "admin123";

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: process.env.DATABASE_HOST ?? "127.0.0.1",
    user: process.env.DATABASE_USER ?? "root",
    password: process.env.DATABASE_PASSWORD ?? "",
    database: process.env.DATABASE_NAME ?? "bone_koboyi",
    port: Number(process.env.DATABASE_PORT ?? 3306),
    connectionLimit: 5,
    connectTimeout: 10_000,
  }),
});

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const legacy = await prisma.superAdmin.findUnique({
    where: { email: LEGACY_EMAIL },
  });
  const existing = await prisma.superAdmin.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (legacy && !existing) {
    await prisma.superAdmin.update({
      where: { id: legacy.id },
      data: {
        email: ADMIN_EMAIL,
        name: legacy.name || "Super Admin",
        passwordHash,
      },
    });
    console.log(`Renamed ${LEGACY_EMAIL} → ${ADMIN_EMAIL}`);
  } else if (legacy && existing) {
    await prisma.superAdmin.delete({ where: { id: legacy.id } });
    await prisma.superAdmin.update({
      where: { id: existing.id },
      data: { passwordHash, name: existing.name || "Super Admin" },
    });
    console.log(`Removed legacy ${LEGACY_EMAIL}; updated ${ADMIN_EMAIL}`);
  } else {
    await prisma.superAdmin.upsert({
      where: { email: ADMIN_EMAIL },
      update: { passwordHash, name: "Super Admin" },
      create: {
        email: ADMIN_EMAIL,
        passwordHash,
        name: "Super Admin",
      },
    });
    console.log(`Upserted super admin ${ADMIN_EMAIL}`);
  }

  const admin = await prisma.superAdmin.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true, email: true, name: true },
  });
  console.log("Super admin ready:", admin);
  console.log(`Login: ${ADMIN_EMAIL} / ${DEFAULT_PASSWORD}`);
  console.log("Forgot password → codes are emailed to that Gmail address.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
