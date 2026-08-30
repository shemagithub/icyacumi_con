import type { Prisma } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";
import { products as seedProducts } from "../../src/data/catalog";
import { ads, events, vendors } from "../../src/data/marketplace";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? "localhost",
  user: process.env.DATABASE_USER ?? "root",
  password: process.env.DATABASE_PASSWORD ?? "",
  database: process.env.DATABASE_NAME ?? "bone_koboyi",
  port: Number(process.env.DATABASE_PORT ?? 3306),
});

const prisma = new PrismaClient({ adapter });

const PORTAL_PASSWORD = "brand123";

async function main() {
  const passwordHash = await bcrypt.hash(PORTAL_PASSWORD, 10);

  for (const vendor of vendors) {
    await prisma.brand.upsert({
      where: { id: vendor.id },
      create: {
        id: vendor.id,
        slug: vendor.slug,
        name: vendor.name,
        shortBio: vendor.shortBio,
        location: vendor.location,
        icon: vendor.icon,
        status: "approved",
        approvedAt: new Date(),
      },
      update: {
        slug: vendor.slug,
        name: vendor.name,
        shortBio: vendor.shortBio,
        location: vendor.location,
        icon: vendor.icon,
        status: "approved",
        approvedAt: new Date(),
      },
    });

    const email = `${vendor.slug.replace(/-/g, ".")}@portal.local`;
    await prisma.brandUser.upsert({
      where: { email },
      update: {
        passwordHash,
        name: `${vendor.name} Admin`,
        brandId: vendor.id,
        role: "owner",
        emailVerifiedAt: new Date(),
      },
      create: {
        email,
        passwordHash,
        name: `${vendor.name} Admin`,
        brandId: vendor.id,
        role: "owner",
        emailVerifiedAt: new Date(),
      },
    });
  }

  for (const product of seedProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        slug: product.slug,
        brandId: product.vendorId,
        name: product.name,
        tagline: product.tagline,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        category: product.category,
        collection: product.collection,
        colors: product.colors as unknown as Prisma.InputJsonValue,
        sizes: product.sizes as unknown as Prisma.InputJsonValue,
        images: product.images as unknown as Prisma.InputJsonValue,
        fabric: product.fabric,
        fit: product.fit,
        details: product.details as unknown as Prisma.InputJsonValue,
        badge: product.badge ?? null,
        featured: Boolean(product.featured),
        inStock: product.inStock,
        stockQuantity: product.inStock
          ? Math.max(1, Number(product.stockQuantity) || 25)
          : 0,
        views: product.views,
      },
      create: {
        id: product.id,
        slug: product.slug,
        brandId: product.vendorId,
        name: product.name,
        tagline: product.tagline,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        category: product.category,
        collection: product.collection,
        colors: product.colors as unknown as Prisma.InputJsonValue,
        sizes: product.sizes as unknown as Prisma.InputJsonValue,
        images: product.images as unknown as Prisma.InputJsonValue,
        fabric: product.fabric,
        fit: product.fit,
        details: product.details as unknown as Prisma.InputJsonValue,
        badge: product.badge ?? null,
        featured: Boolean(product.featured),
        inStock: product.inStock,
        stockQuantity: product.inStock
          ? Math.max(1, Number(product.stockQuantity) || 25)
          : 0,
        views: product.views,
      },
    });
  }

  for (const event of events) {
    const brandId = event.vendorIds[0] ?? "v-bone";
    await prisma.event.upsert({
      where: { id: event.id },
      update: {
        slug: event.slug,
        brandId,
        title: event.title,
        summary: event.summary,
        date: new Date(`${event.date}T12:00:00.000Z`),
        time: event.time,
        venue: event.venue,
        city: event.city,
        price: event.price,
        capacity: event.capacity,
        ticketsLeft: event.ticketsLeft,
        imageSrc: event.image.src,
        imageAlt: event.image.alt,
      },
      create: {
        id: event.id,
        slug: event.slug,
        brandId,
        title: event.title,
        summary: event.summary,
        date: new Date(`${event.date}T12:00:00.000Z`),
        time: event.time,
        venue: event.venue,
        city: event.city,
        price: event.price,
        capacity: event.capacity,
        ticketsLeft: event.ticketsLeft,
        imageSrc: event.image.src,
        imageAlt: event.image.alt,
      },
    });
  }

  for (const ad of ads) {
    const brand =
      (await prisma.brand.findFirst({ where: { name: ad.brand } })) ??
      (await prisma.brand.findFirst({ where: { id: "v-bone" } }));
    if (!brand) continue;

    await prisma.ad.upsert({
      where: { id: ad.id },
      update: {
        slug: ad.slug,
        brandId: brand.id,
        title: ad.title,
        type: ad.type,
        summary: ad.summary,
        mediaSrc: ad.media.src,
        mediaAlt: ad.media.alt,
        mediaUrl: ad.mediaUrl ?? null,
        ctaHref: ad.ctaHref,
        ctaLabel: ad.ctaLabel,
        featured: Boolean(ad.featured),
      },
      create: {
        id: ad.id,
        slug: ad.slug,
        brandId: brand.id,
        title: ad.title,
        type: ad.type,
        summary: ad.summary,
        mediaSrc: ad.media.src,
        mediaAlt: ad.media.alt,
        mediaUrl: ad.mediaUrl ?? null,
        ctaHref: ad.ctaHref,
        ctaLabel: ad.ctaLabel,
        featured: Boolean(ad.featured),
      },
    });
  }

  await prisma.client.upsert({
    where: { email: "client@demo.local" },
    update: {
      passwordHash,
      name: "Demo Client",
      emailVerifiedAt: new Date(),
      phone: "+250788000000",
      addressLine1: "KG 1 Ave",
      city: "Kigali",
      country: "Rwanda",
    },
    create: {
      email: "client@demo.local",
      passwordHash,
      name: "Demo Client",
      emailVerifiedAt: new Date(),
      phone: "+250788000000",
      addressLine1: "KG 1 Ave",
      city: "Kigali",
      country: "Rwanda",
    },
  });

  const adminHash = await bcrypt.hash("admin123", 10);
  await prisma.superAdmin.upsert({
    where: { email: "admin@bonekoboyi.com" },
    update: {
      passwordHash: adminHash,
      name: "Super Admin",
    },
    create: {
      email: "admin@bonekoboyi.com",
      passwordHash: adminHash,
      name: "Super Admin",
    },
  });

  await prisma.platformSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      productCommissionPercent: 10,
      ticketCommissionPercent: 5,
    },
  });

  console.log("Seed complete.");
  console.log("MySQL database: bone_koboyi (open in phpMyAdmin)");
  console.log("Portal logins (password: brand123):");
  for (const vendor of vendors) {
    console.log(`  ${vendor.name}: ${vendor.slug.replace(/-/g, ".")}@portal.local`);
  }
  console.log("Demo client: client@demo.local / brand123");
  console.log("Super admin: admin@bonekoboyi.com / admin123");
  console.log("Default product commission: 10% · ticket commission: 5%");

  const { ensureLegalPages } = await import("../src/lib/legal.js");
  await ensureLegalPages();
  console.log("Legal pages ready: terms, privacy");

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {
      type: "percent",
      value: 10,
      active: true,
      description: "10% off launch promo",
    },
    create: {
      code: "WELCOME10",
      type: "percent",
      value: 10,
      active: true,
      description: "10% off launch promo",
    },
  });
  await prisma.coupon.upsert({
    where: { code: "FREESHIP" },
    update: {
      type: "free_shipping",
      value: 0,
      active: true,
      description: "Free shipping",
    },
    create: {
      code: "FREESHIP",
      type: "free_shipping",
      value: 0,
      active: true,
      description: "Free shipping",
    },
  });
  await prisma.coupon.upsert({
    where: { code: "SAVE2000" },
    update: {
      type: "fixed",
      value: 2000,
      minSubtotal: 10_000,
      active: true,
      description: "2000 RWF off orders from 10k",
    },
    create: {
      code: "SAVE2000",
      type: "fixed",
      value: 2000,
      minSubtotal: 10_000,
      active: true,
      description: "2000 RWF off orders from 10k",
    },
  });
  console.log("Sample coupons: WELCOME10, FREESHIP, SAVE2000");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
