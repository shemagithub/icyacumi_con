import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  clearAuthCookie,
  createAuthToken,
  getBrandUserByEmail,
  requireBrand,
  setAuthCookie,
  type AuthedRequest,
  type AuthSession,
} from "../lib/auth.js";
import { prisma } from "../lib/db.js";
import {
  BRAND_WITHDRAWAL_FEE_RWF,
  BRAND_WITHDRAWAL_MIN_NET_RWF,
  getBrandPayoutSummary,
  listBrandSales,
  payoutBalanceDebit,
} from "../lib/earnings.js";
import {
  STATUS_LABELS,
  ORDER_STATUSES,
  buildOrderStatusUpdate,
  isOrderStatus,
  mapOrder,
  notifyOrderStatusChange,
  type OrderStatus,
} from "../lib/orders.js";
import { parseStockQuantity } from "../lib/inventory.js";
import { parseCredits } from "../lib/credits.js";
import { mapAd, mapEvent, mapProduct } from "../lib/mappers.js";
import {
  sendListingPublishedEmail,
  sendPayoutRequestedEmail,
} from "../lib/mail.js";

const PRODUCT_CATEGORIES = new Set([
  "outerwear",
  "fleece",
  "tees",
  "shirts",
  "denim",
  "pants",
  "accessories",
]);
const PRODUCT_COLLECTIONS = new Set([
  "dust-season",
  "rodeo-nights",
  "bone-basics",
]);
const PRODUCT_SIZES = new Set(["XS", "S", "M", "L", "XL", "XXL", "OS"]);

function paramId(value: string | string[] | undefined): string {
  return String(Array.isArray(value) ? value[0] : value ?? "");
}

function parseProductColors(raw: unknown): Array<{ name: string; hex: string }> {
  if (!Array.isArray(raw)) return [{ name: "Default", hex: "#17171A" }];
  const colors = raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as { name?: unknown; hex?: unknown };
      const name = String(row.name ?? "").trim().slice(0, 60);
      let hex = String(row.hex ?? "#17171A").trim();
      if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) hex = "#17171A";
      if (!name) return null;
      return { name, hex };
    })
    .filter((entry): entry is { name: string; hex: string } => Boolean(entry));
  return colors.length ? colors.slice(0, 12) : [{ name: "Default", hex: "#17171A" }];
}

function parseProductSizes(raw: unknown): string[] {
  const list = Array.isArray(raw)
    ? raw.map((value) => String(value).trim().toUpperCase())
    : [];
  const sizes = list.filter((size) => PRODUCT_SIZES.has(size));
  return sizes.length ? [...new Set(sizes)].slice(0, 8) : ["S", "M", "L", "XL"];
}

function parseProductDetails(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((line) => String(line ?? "").trim())
      .filter(Boolean)
      .slice(0, 20);
  }
  if (typeof raw === "string") {
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 20);
  }
  return ["Managed in brand portal"];
}

function parseProductImages(
  raw: unknown,
  fallbackSrc: string,
  alt: string,
): Array<{ src: string; alt: string }> {
  if (Array.isArray(raw) && raw.length) {
    const images = raw
      .map((entry) => {
        if (typeof entry === "string") {
          const src = normalizeImageSrc(entry);
          return src ? { src, alt } : null;
        }
        if (entry && typeof entry === "object") {
          const row = entry as { src?: unknown; alt?: unknown };
          const src = normalizeImageSrc(String(row.src ?? ""));
          if (!src) return null;
          return {
            src,
            alt: String(row.alt ?? alt).trim().slice(0, 200) || alt,
          };
        }
        return null;
      })
      .filter((entry): entry is { src: string; alt: string } => Boolean(entry));
    if (images.length) return images.slice(0, 8);
  }
  return [{ src: fallbackSrc || "/editorial/look-01.png", alt }];
}

function normalizeImageSrc(value: string): string | null {
  const src = value.trim();
  if (!src) return null;
  if (src.startsWith("data:image/")) {
    if (src.length > 900_000) return null;
    return src;
  }
  return src.slice(0, 500);
}

async function brandOwnerEmails(brandId: string) {
  const users = await prisma.brandUser.findMany({
    where: { brandId },
    select: { email: true },
  });
  return users.map((user) => user.email);
}

function brandOf(req: AuthedRequest) {
  const session = req.auth;
  if (!session || session.type !== "brand") {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export const portalRouter = Router();

portalRouter.post("/auth/login", async (req, res) => {
  const email = String(req.body?.email ?? "")
    .toLowerCase()
    .trim();
  const password = String(req.body?.password ?? "");
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required." });
    return;
  }

  const user = await getBrandUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid login." });
    return;
  }
  if (!user.emailVerifiedAt) {
    res.status(403).json({
      error: "Verify your email first.",
      needsVerification: true,
      email: user.email,
    });
    return;
  }
  if (user.brand.status !== "approved") {
    res.status(403).json({
      error:
        user.brand.status === "rejected"
          ? user.brand.rejectedReason ||
            "This brand application was not approved."
          : "Your brand is waiting for platform approval.",
      needsApproval: true,
      status: user.brand.status,
      brandName: user.brand.name,
      redirectTo: `/brand-pending?email=${encodeURIComponent(user.email)}&brand=${encodeURIComponent(user.brand.name)}`,
    });
    return;
  }

  const session: AuthSession = {
    type: "brand",
    userId: user.id,
    brandId: user.brandId,
    email: user.email,
    name: user.name,
    brandName: user.brand.name,
    brandSlug: user.brand.slug,
  };
  const token = await createAuthToken(session);
  setAuthCookie(res, token);

  res.json({
    ok: true,
    role: "brand",
    redirectTo: "/portal",
    brand: { id: user.brandId, name: user.brand.name, slug: user.brand.slug },
  });
});

portalRouter.post("/auth/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

portalRouter.get("/me", requireBrand, async (req: AuthedRequest, res) => {
  res.json({ session: brandOf(req) });
});

portalRouter.get("/dashboard", requireBrand, async (req: AuthedRequest, res) => {
  const brandId = brandOf(req).brandId;
  const [productCount, eventCount, adCount, payout] = await Promise.all([
    prisma.product.count({ where: { brandId } }),
    prisma.event.count({ where: { brandId } }),
    prisma.ad.count({ where: { brandId } }),
    getBrandPayoutSummary(brandId),
  ]);
  res.json({
    productCount,
    eventCount,
    adCount,
    pendingPayout: payout.pending,
    available: payout.available,
    totalEarned: payout.totalEarned,
    salesGross: payout.salesGross,
    orderCount: payout.orderCount,
    recentSales: payout.recentLines.map((line) => ({
      id: line.id,
      reference: line.reference,
      name: line.name,
      kind: line.kind,
      lineTotal: line.lineTotal,
      brandKeeps: line.brandKeeps,
      date: line.date,
      orderStatus: line.orderStatus,
      statusLabel:
        STATUS_LABELS[line.orderStatus as OrderStatus] ?? line.orderStatus,
    })),
    session: brandOf(req),
  });
});

portalRouter.get("/products", requireBrand, async (req: AuthedRequest, res) => {
  const rows = await prisma.product.findMany({
    where: { brandId: brandOf(req).brandId },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ products: rows.map((row) => mapProduct(row)) });
});

portalRouter.post("/products", requireBrand, async (req: AuthedRequest, res) => {
  const name = String(req.body?.name ?? "").trim().slice(0, 200);
  const price = Number(req.body?.price);
  if (!name || !Number.isFinite(price) || price < 1) {
    res.status(400).json({ error: "Name and price are required." });
    return;
  }

  const slugBase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  const compareAt = req.body?.compareAtPrice ? Number(req.body.compareAtPrice) : null;
  const categoryRaw = String(req.body?.category ?? "tees");
  const collectionRaw = String(req.body?.collection ?? "bone-basics");
  const category = PRODUCT_CATEGORIES.has(categoryRaw) ? categoryRaw : "tees";
  const collection = PRODUCT_COLLECTIONS.has(collectionRaw)
    ? collectionRaw
    : "bone-basics";
  const stockQuantity = parseStockQuantity(req.body?.stockQuantity, 1);
  const imageSrc = String(req.body?.imageSrc ?? "/editorial/look-01.png");
  const images = parseProductImages(req.body?.images ?? req.body?.imageSrc, imageSrc, name);
  const colors = parseProductColors(req.body?.colors);
  const sizes = parseProductSizes(req.body?.sizes);
  const details = parseProductDetails(req.body?.details);
  const credits = parseCredits(req.body?.credits);
  const tagline =
    String(req.body?.tagline ?? "").trim().slice(0, 255) || "Brand drop";
  const description =
    String(req.body?.description ?? tagline ?? name).trim().slice(0, 5000) || name;

  const row = await prisma.product.create({
    data: {
      slug: `${slugBase}-${Date.now().toString().slice(-5)}`,
      brandId: brandOf(req).brandId,
      name,
      tagline,
      description,
      price: Math.round(price),
      compareAtPrice: compareAt && compareAt > price ? Math.round(compareAt) : null,
      category,
      collection,
      colors,
      sizes,
      images,
      fabric: String(req.body?.fabric ?? "See brand").trim().slice(0, 255) || "See brand",
      fit: String(req.body?.fit ?? "True to size").trim().slice(0, 255) || "True to size",
      details,
      credits,
      badge: req.body?.badge ? String(req.body.badge).trim().slice(0, 60) : null,
      featured: Boolean(req.body?.featured),
      stockQuantity,
      inStock: req.body?.inStock === false ? false : stockQuantity > 0,
      views: 1,
    },
  });

  const session = brandOf(req);
  void sendListingPublishedEmail({
    to: [session.email],
    brandName: session.brandName,
    kind: "product",
    title: row.name,
    href: `/shop/${row.slug}`,
  });

  res.status(201).json({ product: mapProduct(row) });
});

portalRouter.patch("/products/:id", requireBrand, async (req: AuthedRequest, res) => {
  const existing = await prisma.product.findFirst({
    where: { id: paramId(req.params.id), brandId: brandOf(req).brandId },
  });
  if (!existing) {
    res.status(404).json({ error: "Not found." });
    return;
  }

  const body = req.body ?? {};
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name.trim().slice(0, 200);
  if (typeof body.tagline === "string") data.tagline = body.tagline.trim().slice(0, 255);
  if (typeof body.description === "string") {
    data.description = body.description.trim().slice(0, 5000);
  }
  if (typeof body.price === "number") data.price = Math.round(body.price);
  if (typeof body.compareAtPrice === "number" || body.compareAtPrice === null) {
    data.compareAtPrice = body.compareAtPrice;
  }
  if (typeof body.category === "string" && PRODUCT_CATEGORIES.has(body.category)) {
    data.category = body.category;
  }
  if (typeof body.collection === "string" && PRODUCT_COLLECTIONS.has(body.collection)) {
    data.collection = body.collection;
  }
  if (typeof body.fabric === "string") data.fabric = body.fabric.trim().slice(0, 255);
  if (typeof body.fit === "string") data.fit = body.fit.trim().slice(0, 255);
  if (body.badge !== undefined) {
    data.badge = body.badge ? String(body.badge).trim().slice(0, 60) : null;
  }
  if (body.colors !== undefined) data.colors = parseProductColors(body.colors);
  if (body.sizes !== undefined) data.sizes = parseProductSizes(body.sizes);
  if (body.details !== undefined) data.details = parseProductDetails(body.details);
  if (body.credits !== undefined) data.credits = parseCredits(body.credits);
  if (body.images !== undefined || typeof body.imageSrc === "string") {
    data.images = parseProductImages(
      body.images ?? body.imageSrc,
      String(body.imageSrc ?? "/editorial/look-01.png"),
      String(data.name ?? existing.name),
    );
  }
  if (body.stockQuantity !== undefined && body.stockQuantity !== null) {
    const qty = parseStockQuantity(body.stockQuantity, existing.stockQuantity);
    data.stockQuantity = qty;
    data.inStock = qty > 0;
  }
  if (typeof body.inStock === "boolean" && body.stockQuantity === undefined) {
    if (body.inStock) {
      const qty = existing.stockQuantity > 0 ? existing.stockQuantity : 1;
      data.stockQuantity = qty;
      data.inStock = true;
    } else {
      data.inStock = false;
    }
  }
  if (typeof body.featured === "boolean") data.featured = body.featured;

  const row = await prisma.product.update({ where: { id: existing.id }, data });
  res.json({ product: mapProduct(row) });
});

portalRouter.delete("/products/:id", requireBrand, async (req: AuthedRequest, res) => {
  const existing = await prisma.product.findFirst({
    where: { id: paramId(req.params.id), brandId: brandOf(req).brandId },
  });
  if (!existing) {
    res.status(404).json({ error: "Not found." });
    return;
  }
  await prisma.product.delete({ where: { id: existing.id } });
  res.json({ ok: true });
});

/** Brands can view their events (tickets/earnings) but only super-admin creates/edits them. */
portalRouter.get("/events", requireBrand, async (req: AuthedRequest, res) => {
  const rows = await prisma.event.findMany({
    where: { brandId: brandOf(req).brandId },
    orderBy: { date: "asc" },
  });
  res.json({ events: rows.map(mapEvent) });
});

portalRouter.post("/events", requireBrand, async (_req, res) => {
  res.status(403).json({
    error: "Events are created by the platform admin. Contact ICYACUMI to list an event.",
  });
});

portalRouter.delete("/events/:id", requireBrand, async (_req, res) => {
  res.status(403).json({
    error: "Events are managed by the platform admin. Contact ICYACUMI to change or remove an event.",
  });
});

portalRouter.get("/ads", requireBrand, async (req: AuthedRequest, res) => {
  const rows = await prisma.ad.findMany({
    where: { brandId: brandOf(req).brandId },
    include: { brand: true },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ ads: rows.map(mapAd) });
});

portalRouter.post("/ads", requireBrand, async (req: AuthedRequest, res) => {
  const title = String(req.body?.title ?? "").trim();
  if (!title) {
    res.status(400).json({ error: "Title required." });
    return;
  }
  const slugBase = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  const row = await prisma.ad.create({
    data: {
      slug: `${slugBase}-${Date.now().toString().slice(-5)}`,
      brandId: brandOf(req).brandId,
      title,
      type: String(req.body?.type ?? "photo"),
      summary: String(req.body?.summary ?? "").trim() || title,
      mediaSrc: String(req.body?.mediaSrc ?? "/editorial/look-01.png"),
      mediaAlt: title,
      mediaUrl: req.body?.mediaUrl ? String(req.body.mediaUrl) : null,
      ctaHref: String(req.body?.ctaHref ?? "/shop"),
      ctaLabel: String(req.body?.ctaLabel ?? "Shop now"),
      featured: Boolean(req.body?.featured),
      credits: parseCredits(req.body?.credits),
    },
    include: { brand: true },
  });

  const session = brandOf(req);
  void sendListingPublishedEmail({
    to: [session.email],
    brandName: session.brandName,
    kind: "ad",
    title: row.title,
    href: "/ads",
  });

  res.status(201).json({ ad: mapAd(row) });
});

portalRouter.delete("/ads/:id", requireBrand, async (req: AuthedRequest, res) => {
  const existing = await prisma.ad.findFirst({
    where: { id: paramId(req.params.id), brandId: brandOf(req).brandId },
  });
  if (!existing) {
    res.status(404).json({ error: "Not found." });
    return;
  }
  await prisma.ad.delete({ where: { id: existing.id } });
  res.json({ ok: true });
});

portalRouter.get("/profile", requireBrand, async (req: AuthedRequest, res) => {
  const session = brandOf(req);
  const user = await prisma.brandUser.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      brand: { select: { name: true, slug: true } },
    },
  });
  if (!user) {
    res.status(404).json({ error: "Account not found." });
    return;
  }
  res.json({
    profile: {
      id: user.id,
      email: user.email,
      name: user.name,
      brandName: user.brand.name,
      brandSlug: user.brand.slug,
      createdAt: user.createdAt,
    },
  });
});

portalRouter.patch("/profile", requireBrand, async (req: AuthedRequest, res) => {
  const session = brandOf(req);
  const name = String(req.body?.name ?? "").trim().slice(0, 120);
  if (!name) {
    res.status(400).json({ error: "Name is required." });
    return;
  }
  const user = await prisma.brandUser.update({
    where: { id: session.userId },
    data: { name },
    include: { brand: { select: { name: true, slug: true } } },
  });
  const nextSession: AuthSession = {
    type: "brand",
    userId: user.id,
    brandId: user.brandId,
    email: user.email,
    name: user.name,
    brandName: user.brand.name,
    brandSlug: user.brand.slug,
  };
  const token = await createAuthToken(nextSession);
  setAuthCookie(res, token);
  res.json({
    ok: true,
    profile: {
      id: user.id,
      email: user.email,
      name: user.name,
      brandName: user.brand.name,
      brandSlug: user.brand.slug,
    },
    user: nextSession,
  });
});

portalRouter.get("/settings", requireBrand, async (req: AuthedRequest, res) => {
  const brandId = brandOf(req).brandId;
  const [brand, users] = await Promise.all([
    prisma.brand.findUnique({ where: { id: brandId } }),
    prisma.brandUser.findMany({
      where: { brandId },
      select: { email: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  if (!brand) {
    res.status(404).json({ error: "Brand not found." });
    return;
  }
  res.json({
    brand: {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      shortBio: brand.shortBio,
      location: brand.location,
      icon: brand.icon,
      contactEmail: brand.contactEmail,
      contactPhone: brand.contactPhone,
      instagram: brand.instagram,
      tiktok: brand.tiktok,
      facebook: brand.facebook,
      twitter: brand.twitter,
      youtube: brand.youtube,
      website: brand.website,
      payoutProvider: brand.payoutProvider,
      payoutAccount: brand.payoutAccount,
    },
    notificationEmails: users.map((user) => user.email),
  });
});

portalRouter.patch("/settings", requireBrand, async (req: AuthedRequest, res) => {
  const brandId = brandOf(req).brandId;
  const body = req.body ?? {};

  function cleanUrl(value: unknown) {
    const text = String(value ?? "").trim();
    return text ? text.slice(0, 255) : null;
  }

  function cleanEmail(value: unknown) {
    const text = String(value ?? "").trim().toLowerCase();
    return text ? text.slice(0, 190) : null;
  }

  function cleanPhone(value: unknown) {
    const text = String(value ?? "").trim();
    return text ? text.slice(0, 40) : null;
  }

  const brand = await prisma.brand.update({
    where: { id: brandId },
    data: {
      shortBio:
        typeof body.shortBio === "string"
          ? body.shortBio.trim().slice(0, 500) || "Marketplace brand"
          : undefined,
      location:
        typeof body.location === "string"
          ? body.location.trim().slice(0, 120) || "Rwanda"
          : undefined,
      contactEmail:
        body.contactEmail !== undefined ? cleanEmail(body.contactEmail) : undefined,
      contactPhone:
        body.contactPhone !== undefined ? cleanPhone(body.contactPhone) : undefined,
      instagram: body.instagram !== undefined ? cleanUrl(body.instagram) : undefined,
      tiktok: body.tiktok !== undefined ? cleanUrl(body.tiktok) : undefined,
      facebook: body.facebook !== undefined ? cleanUrl(body.facebook) : undefined,
      twitter: body.twitter !== undefined ? cleanUrl(body.twitter) : undefined,
      youtube: body.youtube !== undefined ? cleanUrl(body.youtube) : undefined,
      website: body.website !== undefined ? cleanUrl(body.website) : undefined,
      payoutProvider:
        body.payoutProvider !== undefined
          ? String(body.payoutProvider ?? "").trim().slice(0, 40) || null
          : undefined,
      payoutAccount:
        body.payoutAccount !== undefined
          ? String(body.payoutAccount ?? "").trim().slice(0, 120) || null
          : undefined,
    },
  });

  res.json({
    ok: true,
    brand: {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      shortBio: brand.shortBio,
      location: brand.location,
      contactEmail: brand.contactEmail,
      contactPhone: brand.contactPhone,
      instagram: brand.instagram,
      tiktok: brand.tiktok,
      facebook: brand.facebook,
      twitter: brand.twitter,
      youtube: brand.youtube,
      website: brand.website,
      payoutProvider: brand.payoutProvider,
      payoutAccount: brand.payoutAccount,
    },
  });
});

portalRouter.get("/sales", requireBrand, async (req: AuthedRequest, res) => {
  const brandId = brandOf(req).brandId;
  const report = await listBrandSales(brandId);
  res.json({
    settings: report.settings,
    totals: report.totals,
    statuses: ORDER_STATUSES,
    statusLabels: STATUS_LABELS,
    lines: report.lines.map((line) => ({
      ...line,
      statusLabel:
        STATUS_LABELS[line.orderStatus as OrderStatus] ?? line.orderStatus,
      canManageOrder: true,
    })),
  });
});

/**
 * Brand updates fulfillment on an order that includes their products/tickets.
 */
portalRouter.patch("/orders/:reference", requireBrand, async (req: AuthedRequest, res) => {
  const brandId = brandOf(req).brandId;
  const reference = String(req.params.reference ?? "")
    .trim()
    .toUpperCase();
  const status = String(req.body?.status ?? "").trim();

  if (!isOrderStatus(status)) {
    res.status(400).json({ error: "Invalid status." });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { reference },
    include: { items: true },
  });
  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  const [productIds, eventIds] = await Promise.all([
    prisma.product
      .findMany({ where: { brandId }, select: { id: true } })
      .then((rows) => new Set(rows.map((row) => row.id))),
    prisma.event
      .findMany({ where: { brandId }, select: { id: true } })
      .then((rows) => new Set(rows.map((row) => row.id))),
  ]);

  const brandItems = order.items.filter((item) => {
    if (item.brandId === brandId) return true;
    if (!item.productId) return false;
    if (item.kind === "ticket") return eventIds.has(item.productId);
    return productIds.has(item.productId);
  });

  if (!brandItems.length) {
    res.status(403).json({
      error: "This order does not include products or tickets from your brand.",
    });
    return;
  }

  // Prefer sole-brand control; still allow if brand has items but warn via flag
  const foreignItems = order.items.filter((item) => !brandItems.some((b) => b.id === item.id));
  const soleBrand = foreignItems.length === 0;

  if (!soleBrand && status === "cancelled") {
    res.status(403).json({
      error:
        "This order also has items from other brands. Only the marketplace admin can cancel it.",
    });
    return;
  }

  const data = buildOrderStatusUpdate({
    status,
    trackingCode: req.body?.trackingCode,
    carrier: req.body?.carrier,
    patchTracking: req.body?.trackingCode !== undefined,
    patchCarrier: req.body?.carrier !== undefined,
  });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data,
    include: { items: true },
  });

  void notifyOrderStatusChange({
    email: updated.email,
    customerName: updated.customerName,
    reference: updated.reference,
    status: updated.status,
    trackingCode: updated.trackingCode,
    carrier: updated.carrier,
    items: updated.items.map((item) => ({
      brandId: item.brandId,
      brandName: item.brandName,
      productId: item.productId,
      kind: item.kind,
    })),
  }).catch((err) => console.error("[portal] order status mail", err));

  res.json({
    order: mapOrder(updated),
    soleBrand,
    message: soleBrand
      ? "Order updated. Customer was notified."
      : "Order updated. This order also includes other brands · customer was notified.",
  });
});

portalRouter.get("/payments", requireBrand, async (req: AuthedRequest, res) => {
  const brandId = brandOf(req).brandId;
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) {
    res.status(404).json({ error: "Brand not found." });
    return;
  }

  const [summary, payouts] = await Promise.all([
    getBrandPayoutSummary(brandId),
    prisma.payout.findMany({ where: { brandId }, orderBy: { createdAt: "desc" } }),
  ]);

  res.json({
    stripeAccountId: brand.stripeAccountId,
    payoutProvider: brand.payoutProvider,
    payoutAccount: brand.payoutAccount,
    summary,
    payouts,
  });
});

portalRouter.post("/payments", requireBrand, async (req: AuthedRequest, res) => {
  const brandId = brandOf(req).brandId;
  const body = req.body ?? {};

  if (body.action === "connect") {
    const accountId = String(body.stripeAccountId ?? "").trim();
    const payoutProvider = String(body.payoutProvider ?? "").trim().slice(0, 40);
    const payoutAccount = String(body.payoutAccount ?? "").trim().slice(0, 120);
    await prisma.brand.update({
      where: { id: brandId },
      data: {
        stripeAccountId: accountId || null,
        payoutProvider: payoutProvider || null,
        payoutAccount: payoutAccount || null,
      },
    });
    res.json({
      ok: true,
      stripeAccountId: accountId || null,
      payoutProvider: payoutProvider || null,
      payoutAccount: payoutAccount || null,
    });
    return;
  }

  if (body.action === "payout") {
    const amount = Math.round(Number(body.amount));
    const feeAmount = BRAND_WITHDRAWAL_FEE_RWF;
    if (!Number.isFinite(amount) || amount < BRAND_WITHDRAWAL_MIN_NET_RWF) {
      res.status(400).json({
        error: `Minimum withdrawal is RWF ${BRAND_WITHDRAWAL_MIN_NET_RWF} (plus ${feeAmount} RWF fee).`,
      });
      return;
    }

    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) {
      res.status(404).json({ error: "Brand not found." });
      return;
    }

    const summary = await getBrandPayoutSummary(brandId);
    const available = summary.available;
    const totalDebit = payoutBalanceDebit({ amount, feeAmount });

    if (totalDebit > available) {
      const maxNet = Math.max(0, available - feeAmount);
      res.status(400).json({
        error:
          maxNet < BRAND_WITHDRAWAL_MIN_NET_RWF
            ? `Need at least ${(feeAmount + BRAND_WITHDRAWAL_MIN_NET_RWF).toLocaleString()} RWF available (includes ${feeAmount.toLocaleString()} RWF withdrawal fee).`
            : `You can withdraw up to ${maxNet.toLocaleString()} RWF after the ${feeAmount.toLocaleString()} RWF fee (available ${available.toLocaleString()} RWF).`,
      });
      return;
    }

    const provider =
      String(body.payoutProvider ?? brand.payoutProvider ?? "").trim() || "mtn";
    const account =
      String(body.payoutAccount ?? brand.payoutAccount ?? "").trim() || null;

    if (!account) {
      res.status(400).json({
        error: "Add a payout phone/account first (MTN MoMo, Airtel, or bank).",
      });
      return;
    }

    if (body.saveDestination) {
      await prisma.brand.update({
        where: { id: brandId },
        data: {
          payoutProvider: provider,
          payoutAccount: account,
        },
      });
    }

    const noteBase = String(
      body.note ?? `Withdraw via ${provider.toUpperCase()} · ${account}`,
    ).trim();
    const feeNote = `Withdrawal fee ${feeAmount} RWF · you receive ${amount.toLocaleString()} RWF`;
    const note = [noteBase, feeNote].filter(Boolean).join(" · ").slice(0, 500);

    const payout = await prisma.payout.create({
      data: {
        brandId,
        amount,
        feeAmount,
        currency: "RWF",
        status: "pending",
        note,
      },
    });

    void sendPayoutRequestedEmail({
      brandName: brand.name,
      amount: payout.amount,
      feeAmount: payout.feeAmount,
      note: payout.note ?? undefined,
      brandEmails: await brandOwnerEmails(brandId),
    });

    res.status(201).json({
      payout,
      feeAmount,
      totalDebit,
      youReceive: amount,
      available: available - totalDebit,
    });
    return;
  }

  res.status(400).json({ error: "Unknown action." });
});
