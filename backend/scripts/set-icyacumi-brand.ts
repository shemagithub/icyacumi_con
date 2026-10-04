import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client.js";

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
  const row = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (!row) {
    console.log("No site settings row");
    return;
  }
  const updated = await prisma.siteSettings.update({
    where: { id: "default" },
    data: {
      companyName: "ICYACUMI",
      shortName: "ICY",
      displayName: "ICYACUMI",
      logoAlt: "ICYACUMI / MADE IN AFREEKA mark",
      aboutBody:
        row.aboutBody.includes("BONE") || row.aboutBody.includes("KOBOYI")
          ? "ICYACUMI designs contemporary luxury streetwear from African craft languages and modern cultural experimentation · Imigongo geometry, ceremonial marks, hand-finished surfaces. Not costume. Not nostalgia. A way of seeing."
          : row.aboutBody,
    },
  });
  console.log("Updated:", updated.companyName, updated.displayName, updated.shortName);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
