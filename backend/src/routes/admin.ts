import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  clearAuthCookie,
  createAuthToken,
  requireAdmin,
  setAuthCookie,
  type AuthedRequest,
} from "../lib/auth.js";
import { parseCredits } from "../lib/credits.js";
import { prisma } from "../lib/db.js";
import {
  clampPercent,
  DEFAULT_SETTINGS_ID,
  getAdminBrandsMoneyOverview,
  getPlatformCommissionReport,
  getPlatformPayoutSummary,
  getPlatformSettings,
} from "../lib/earnings.js";
import { buildTablePdf } from "../lib/table-pdf.js";
import {
  sendBrandInviteEmail,
  sendListingPublishedEmail,
  sendPayoutStatusEmail,
  isMailConfigured,
} from "../lib/mail.js";
import {
  isXentriPayConfigured,
  xentriPayBaseUrl,
  XENTRIPAY_MIN_AMOUNT,
} from "../lib/xentripay.js";
import {
  getLegalPage,
  isLegalId,
  listLegalPages,
} from "../lib/legal.js";
import {
  getSiteSettings,
  parseSiteSettingsPatch,
  updateSiteSettings,
} from "../lib/site-settings.js";
import {
  mapOrder,
  ORDER_STATUSES,
  STATUS_LABELS,
  buildOrderStatusUpdate,
  isOrderStatus,
  notifyOrderStatusChange,
  type OrderStatus,
} from "../lib/orders.js";
import { mapCoupon, validateCouponFields } from "../lib/coupons.js";

type ChartPoint = { label: string; value: number };

function mondayOf(date: Date) {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() - weekday + 1);
  return day;
}

function weekLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function buildDashboardCharts(input: {
  orders: Array<{ total: number; createdAt: Date; paidAt: Date | null }>;
  commission: Awaited<ReturnType<typeof getPlatformCommissionReport>>;
  platformPayout: Awaited<ReturnType<typeof getPlatformPayoutSummary>>;
  pendingBrandPayout: number;
  brandCount: number;
  clientCount: number;
  productCount: number;
  eventCount: number;
  adCount: number;
  orderCount: number;
}) {
  const weeks = 8;
  const start = mondayOf(new Date());
  start.setUTCDate(start.getUTCDate() - (weeks - 1) * 7);
  const salesByWeek: ChartPoint[] = [];
  for (let i = 0; i < weeks; i += 1) {
    const week = new Date(start);
    week.setUTCDate(start.getUTCDate() + i * 7);
    salesByWeek.push({ label: weekLabel(week), value: 0 });
  }
  for (const order of input.orders) {
    const when = order.paidAt ?? order.createdAt;
    const week = mondayOf(when);
    const index = Math.floor((week.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (index >= 0 && index < weeks) {
      salesByWeek[index]!.value += order.total;
    }
  }

  const brands = input.commission.sellingBrands.slice(0, 6).map((row) => ({
    label: row.brandName,
    value: row.salesGross,
  }));

  return {
    salesByWeek,
    brands,
    mix: [
      { label: "Products", value: input.commission.totals.productSales },
      { label: "Tickets", value: input.commission.totals.ticketSales },
    ],
    split: [
      { label: "Brands keep", value: input.commission.totals.brandKeeps },
      { label: "Platform cut", value: input.commission.totals.platformCommission },
    ],
    commission: [
      { label: "Available", value: input.platformPayout.available },
      { label: "Pending", value: input.platformPayout.pending },
      { label: "Paid out", value: input.platformPayout.paidOut },
    ],
    payouts: [
      { label: "Brand payouts due", value: input.pendingBrandPayout },
      { label: "Your available cut", value: input.platformPayout.available },
    ],
    marketplace: [
      { label: "Brands", value: input.brandCount },
      { label: "Selling", value: input.commission.sellingBrands.length },
      { label: "Clients", value: input.clientCount },
    ],
    catalog: [
      { label: "Orders", value: input.orderCount },
      { label: "Products", value: input.productCount },
      { label: "Events", value: input.eventCount },
      { label: "Ads", value: input.adCount },
    ],
  };
}

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get("/system-status", async (_req, res) => {
  let database = false;
  let pendingPayments = 0;
  let paidOrdersToday = 0;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const [pending, paidToday] = await Promise.all([
      prisma.paymentSession.count({ where: { status: "PENDING" } }),
      prisma.order.count({
        where: {
          status: { not: "cancelled" },
          paidAt: { gte: start },
        },
      }),
    ]);
    pendingPayments = pending;
    paidOrdersToday = paidToday;
  } catch {
    database = false;
  }

  const mailReady = isMailConfigured();
  const paymentsReady = isXentriPayConfigured();

  res.json({
    ok: database,
    checks: [
      {
        id: "database",
        label: "Database",
        ready: database,
        detail: database
          ? "MySQL connected"
          : "Cannot reach MySQL · check DATABASE_* in backend/.env",
      },
      {
        id: "mail",
        label: "Email notifications",
        ready: mailReady,
        detail: mailReady
          ? `Sending as ${process.env.MAIL_FROM || process.env.SMTP_USER}`
          : "Set SMTP_USER / SMTP_PASS in backend/.env",
      },
      {
        id: "payments",
        label: "XentriPay checkout",
        ready: paymentsReady,
        detail: paymentsReady
          ? `Live collections via ${xentriPayBaseUrl()} · min ${XENTRIPAY_MIN_AMOUNT} RWF`
          : "Add XENTRIPAY_API_KEY in backend/.env (test or live merchant key)",
      },
      {
        id: "seo",
        label: "Public SEO",
        ready: Boolean(process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL),
        detail: `Sitemap at ${(process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "")}/sitemap.xml`,
      },
    ],
    stats: {
      pendingPayments,
      paidOrdersToday,
    },
  });
});

adminRouter.get("/profile", async (req: AuthedRequest, res) => {
  const session = req.auth!;
  const admin = await prisma.superAdmin.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!admin) {
    res.status(404).json({ error: "Admin not found." });
    return;
  }
  res.json({
    profile: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      createdAt: admin.createdAt,
    },
  });
});

adminRouter.patch("/profile", async (req: AuthedRequest, res) => {
  const session = req.auth!;
  const name = String(req.body?.name ?? "").trim().slice(0, 120);
  if (!name) {
    res.status(400).json({ error: "Name is required." });
    return;
  }
  const admin = await prisma.superAdmin.update({
    where: { id: session.userId },
    data: { name },
    select: { id: true, email: true, name: true },
  });
  const nextSession = {
    type: "admin" as const,
    userId: admin.id,
    email: admin.email,
    name: admin.name,
  };
  const token = await createAuthToken(nextSession);
  setAuthCookie(res, token);
  res.json({
    ok: true,
    profile: { id: admin.id, email: admin.email, name: admin.name },
    user: nextSession,
  });
});

adminRouter.get("/dashboard", async (_req, res) => {
  const [
    brandCount,
    clientCount,
    productCount,
    eventCount,
    adCount,
    payoutPending,
    adminCount,
    settings,
    commission,
    orderCount,
    platformPayout,
    orders,
  ] = await Promise.all([
    prisma.brand.count(),
    prisma.client.count(),
    prisma.product.count(),
    prisma.event.count(),
    prisma.ad.count(),
    prisma.payout.aggregate({
      where: { status: "pending" },
      _sum: { amount: true },
    }),
    prisma.superAdmin.count(),
    getPlatformSettings(),
    getPlatformCommissionReport(),
    prisma.order.count({ where: { status: { not: "cancelled" } } }),
    getPlatformPayoutSummary(),
    prisma.order.findMany({
      where: { status: { not: "cancelled" } },
      select: { total: true, createdAt: true, paidAt: true },
    }),
  ]);

  res.json({
    brandCount,
    clientCount,
    productCount,
    eventCount,
    adCount,
    pendingPayout: payoutPending._sum.amount ?? 0,
    adminCount,
    orderCount,
    salesGross: commission.totals.salesGross,
    platformCommission: commission.totals.platformCommission,
    platformCommissionAvailable: platformPayout.available,
    platformCommissionPaidOut: platformPayout.paidOut,
    platformCommissionPending: platformPayout.pending,
    sellingBrandCount: commission.sellingBrands.length,
    productCommissionPercent: settings.productCommissionPercent,
    ticketCommissionPercent: settings.ticketCommissionPercent,
    charts: buildDashboardCharts({
      orders,
      commission,
      platformPayout,
      pendingBrandPayout: payoutPending._sum.amount ?? 0,
      brandCount,
      clientCount,
      productCount,
      eventCount,
      adCount,
      orderCount,
    }),
  });
});

adminRouter.get("/settings", async (_req, res) => {
  const settings = await getPlatformSettings();
  res.json({ settings });
});

adminRouter.get("/commission", async (_req, res) => {
  const report = await getPlatformCommissionReport();
  res.json(report);
});

/** Every brand wallet + total money circulating across brands. */
adminRouter.get("/brands-money", async (_req, res) => {
  const overview = await getAdminBrandsMoneyOverview();
  res.json(overview);
});

/** Export any admin table as a PDF download. */
adminRouter.post("/export/pdf", async (req, res) => {
  const title = String(req.body?.title ?? "Export").trim().slice(0, 120) || "Export";
  const subtitle =
    typeof req.body?.subtitle === "string"
      ? req.body.subtitle.trim().slice(0, 200)
      : undefined;
  const columns = Array.isArray(req.body?.columns) ? req.body.columns : [];
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];

  if (!columns.length) {
    res.status(400).json({ error: "Columns are required for PDF export." });
    return;
  }

  const parsedColumns = columns
    .slice(0, 12)
    .map((column: unknown) => {
      const row =
        column && typeof column === "object"
          ? (column as Record<string, unknown>)
          : {};
      return {
        key: String(row.key ?? "").trim(),
        label: String(row.label ?? row.key ?? "").trim(),
        width:
          typeof row.width === "number" && Number.isFinite(row.width)
            ? row.width
            : undefined,
      };
    })
    .filter((column: { key: string }) => Boolean(column.key));

  if (!parsedColumns.length) {
    res.status(400).json({ error: "No valid columns provided." });
    return;
  }

  const parsedRows = rows.slice(0, 2000).map((row: Record<string, unknown>) => {
    const out: Record<string, string | number | null> = {};
    for (const column of parsedColumns) {
      const value = row?.[column.key];
      if (typeof value === "number" && Number.isFinite(value)) {
        out[column.key] = value;
      } else if (value == null) {
        out[column.key] = null;
      } else {
        out[column.key] = String(value).slice(0, 200);
      }
    }
    return out;
  });

  try {
    const pdf = await buildTablePdf({
      title,
      subtitle,
      columns: parsedColumns,
      rows: parsedRows,
    });
    const safeName = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="bone-koboyi-${safeName || "export"}.pdf"`,
    );
    res.send(pdf);
  } catch (error) {
    console.error("[admin/export/pdf]", error);
    res.status(500).json({ error: "Could not build PDF." });
  }
});


adminRouter.patch("/settings", async (req, res) => {
  const productCommissionPercent =
    req.body?.productCommissionPercent !== undefined
      ? clampPercent(Number(req.body.productCommissionPercent))
      : undefined;
  const ticketCommissionPercent =
    req.body?.ticketCommissionPercent !== undefined
      ? clampPercent(Number(req.body.ticketCommissionPercent))
      : undefined;

  if (
    productCommissionPercent === undefined &&
    ticketCommissionPercent === undefined
  ) {
    res.status(400).json({ error: "Provide at least one commission percent." });
    return;
  }

  const settings = await prisma.platformSettings.upsert({
    where: { id: DEFAULT_SETTINGS_ID },
    update: {
      ...(productCommissionPercent !== undefined
        ? { productCommissionPercent }
        : {}),
      ...(ticketCommissionPercent !== undefined
        ? { ticketCommissionPercent }
        : {}),
    },
    create: {
      id: DEFAULT_SETTINGS_ID,
      productCommissionPercent: productCommissionPercent ?? 10,
      ticketCommissionPercent: ticketCommissionPercent ?? 5,
    },
  });

  res.json({
    ok: true,
    settings: {
      productCommissionPercent: settings.productCommissionPercent,
      ticketCommissionPercent: settings.ticketCommissionPercent,
    },
  });
});

adminRouter.get("/brands", async (_req, res) => {
  const brands = await prisma.brand.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { products: true, events: true, ads: true, users: true } },
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerifiedAt: true,
        },
      },
    },
  });
  res.json({
    brands: brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      location: brand.location,
      shortBio: brand.shortBio,
      status: brand.status,
      applicationNote: brand.applicationNote,
      contactEmail: brand.contactEmail,
      contactPhone: brand.contactPhone,
      rejectedReason: brand.rejectedReason,
      createdAt: brand.createdAt,
      kycSubmittedAt: brand.kycSubmittedAt,
      kycIdReady: Boolean(brand.kycIdDocument),
      kycRdbReady: Boolean(brand.kycRdbCertificate),
      _count: brand._count,
      users: brand.users,
    })),
  });
});

adminRouter.get("/brands/:id/kyc", async (req, res) => {
  const id = String(req.params.id ?? "");
  const brand = await prisma.brand.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      kycIdDocument: true,
      kycRdbCertificate: true,
      kycSubmittedAt: true,
    },
  });
  if (!brand) {
    res.status(404).json({ error: "Brand not found." });
    return;
  }
  res.json({
    brand: {
      id: brand.id,
      name: brand.name,
      kycSubmittedAt: brand.kycSubmittedAt,
      kycIdDocument: brand.kycIdDocument,
      kycRdbCertificate: brand.kycRdbCertificate,
    },
  });
});

adminRouter.post("/brands", async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  const slug = String(req.body?.slug ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const shortBio = String(req.body?.shortBio ?? "Marketplace brand").trim();
  const location = String(req.body?.location ?? "Rwanda").trim();
  const icon = String(req.body?.icon ?? "textile").trim();
  const ownerEmail = String(req.body?.ownerEmail ?? "")
    .toLowerCase()
    .trim();
  const ownerName = String(req.body?.ownerName ?? `${name} Admin`).trim();
  const ownerPassword = String(req.body?.ownerPassword ?? "brand123");

  if (!name || !slug) {
    res.status(400).json({ error: "Name and slug are required." });
    return;
  }
  if (!ownerEmail.includes("@")) {
    res.status(400).json({ error: "Owner email is required." });
    return;
  }

  const exists = await prisma.brand.findUnique({ where: { slug } });
  if (exists) {
    res.status(409).json({ error: "Brand slug already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(ownerPassword, 10);
  const brand = await prisma.brand.create({
    data: {
      name,
      slug,
      shortBio,
      location,
      icon,
      status: "approved",
      approvedAt: new Date(),
      users: {
        create: {
          email: ownerEmail,
          name: ownerName,
          passwordHash,
          role: "owner",
          emailVerifiedAt: new Date(),
        },
      },
    },
    include: { users: true },
  });

  void sendBrandInviteEmail({
    to: ownerEmail,
    name: ownerName,
    brandName: name,
    password: ownerPassword,
  });

  res.status(201).json({ brand });
});

adminRouter.delete("/brands/:id", async (req, res) => {
  await prisma.brand.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

adminRouter.patch("/brands/:id/status", async (req, res) => {
  const id = String(req.params.id ?? "");
  const status = String(req.body?.status ?? "").trim();
  const rejectedReason =
    typeof req.body?.rejectedReason === "string"
      ? req.body.rejectedReason.trim().slice(0, 500) || null
      : null;

  if (!["approved", "rejected", "pending"].includes(status)) {
    res.status(400).json({ error: "Status must be approved, rejected, or pending." });
    return;
  }

  const existing = await prisma.brand.findUnique({
    where: { id },
    include: { users: { where: { role: "owner" }, take: 1 } },
  });
  if (!existing) {
    res.status(404).json({ error: "Brand not found." });
    return;
  }

  if (status === "approved") {
    if (!existing.kycIdDocument || !existing.kycRdbCertificate) {
      res.status(400).json({
        error:
          "Cannot approve yet · national ID and RDB certificate KYC docs are missing.",
      });
      return;
    }
  }

  const brand = await prisma.brand.update({
    where: { id },
    data: {
      status,
      approvedAt: status === "approved" ? new Date() : existing.approvedAt,
      rejectedReason: status === "rejected" ? rejectedReason : null,
    },
    include: {
      users: { select: { email: true, name: true, role: true } },
    },
  });

  const owner = brand.users[0];
  if (owner && status === "approved") {
    const { sendBrandApprovedEmail } = await import("../lib/mail.js");
    void sendBrandApprovedEmail({
      to: owner.email,
      ownerName: owner.name,
      brandName: brand.name,
    });
  }
  if (owner && status === "rejected") {
    const { sendBrandRejectedEmail } = await import("../lib/mail.js");
    void sendBrandRejectedEmail({
      to: owner.email,
      ownerName: owner.name,
      brandName: brand.name,
      reason: rejectedReason,
    });
  }

  res.json({ ok: true, brand });
});

adminRouter.get("/clients", async (_req, res) => {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });
  res.json({ clients });
});

adminRouter.delete("/clients/:id", async (req, res) => {
  await prisma.client.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

adminRouter.get("/products", async (_req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: { brand: { select: { id: true, name: true, slug: true } } },
  });
  res.json({ products });
});

adminRouter.delete("/products/:id", async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

adminRouter.patch("/products/:id", async (req, res) => {
  const existing = await prisma.product.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    res.status(404).json({ error: "Not found." });
    return;
  }

  const data: {
    inStock?: boolean;
    stockQuantity?: number;
    featured?: boolean;
    name?: string;
    price?: number;
  } = {};

  if (req.body?.stockQuantity !== undefined && req.body?.stockQuantity !== null) {
    const qty = Math.max(0, Math.round(Number(req.body.stockQuantity) || 0));
    data.stockQuantity = qty;
    data.inStock = qty > 0;
  } else if (typeof req.body?.inStock === "boolean") {
    if (req.body.inStock) {
      data.stockQuantity = existing.stockQuantity > 0 ? existing.stockQuantity : 1;
      data.inStock = true;
    } else {
      data.inStock = false;
      data.stockQuantity = 0;
    }
  }

  if (typeof req.body?.featured === "boolean") data.featured = req.body.featured;
  if (req.body?.name) data.name = String(req.body.name);
  if (req.body?.price !== undefined) data.price = Number(req.body.price);

  const product = await prisma.product.update({
    where: { id: existing.id },
    data,
  });
  res.json({ product });
});

function slugifyEventTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

function parseEventBody(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim();
  const brandId = String(body.brandId ?? "").trim();
  const price = Number(body.price);
  const capacity = Number(body.capacity ?? 100);
  const ticketsLeftRaw = body.ticketsLeft;
  const ticketsLeft =
    ticketsLeftRaw === undefined || ticketsLeftRaw === null || ticketsLeftRaw === ""
      ? capacity
      : Number(ticketsLeftRaw);

  if (!title) return { error: "Title is required." };
  if (!brandId) return { error: "Select a brand for this event." };
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Ticket price must be a valid number." };
  }
  if (!Number.isFinite(capacity) || capacity < 1) {
    return { error: "Capacity must be at least 1." };
  }
  if (!Number.isFinite(ticketsLeft) || ticketsLeft < 0) {
    return { error: "Tickets left must be zero or more." };
  }

  const dateRaw = String(body.date ?? "").trim() || new Date().toISOString().slice(0, 10);
  const date = new Date(`${dateRaw}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return { error: "Invalid event date." };
  }

  return {
    data: {
      brandId,
      title,
      summary: String(body.summary ?? "").trim() || title,
      date,
      time: String(body.time ?? "18:00").trim() || "18:00",
      venue: String(body.venue ?? "TBA").trim() || "TBA",
      city: String(body.city ?? "TBA").trim() || "TBA",
      price: Math.round(price),
      capacity: Math.max(1, Math.round(capacity)),
      ticketsLeft: Math.min(
        Math.max(0, Math.round(ticketsLeft)),
        Math.max(1, Math.round(capacity)),
      ),
      imageSrc: String(body.imageSrc ?? "/editorial/look-01.png").trim() ||
        "/editorial/look-01.png",
      imageAlt: String(body.imageAlt ?? title).trim() || title,
      credits: parseCredits(body.credits),
    },
  };
}

adminRouter.get("/events", async (_req, res) => {
  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    include: { brand: { select: { id: true, name: true, slug: true } } },
  });
  res.json({
    events: events.map((event) => ({
      ...event,
      date: event.date.toISOString().slice(0, 10),
    })),
  });
});

adminRouter.post("/events", async (req, res) => {
  const parsed = parseEventBody((req.body ?? {}) as Record<string, unknown>);
  if ("error" in parsed || !parsed.data) {
    res.status(400).json({ error: parsed.error ?? "Invalid event." });
    return;
  }

  const brand = await prisma.brand.findUnique({
    where: { id: parsed.data.brandId },
    include: { users: { select: { email: true } } },
  });
  if (!brand) {
    res.status(400).json({ error: "Brand not found." });
    return;
  }

  const slug = `${slugifyEventTitle(parsed.data.title)}-${Date.now().toString().slice(-5)}`;
  const event = await prisma.event.create({
    data: {
      slug,
      ...parsed.data,
      imageAlt: parsed.data.imageAlt || parsed.data.title,
    },
    include: { brand: { select: { id: true, name: true, slug: true } } },
  });

  const emails = brand.users.map((user) => user.email).filter(Boolean);
  if (emails.length) {
    void sendListingPublishedEmail({
      to: emails,
      brandName: brand.name,
      kind: "event",
      title: event.title,
      href: `/events/${event.slug}`,
    });
  }

  res.status(201).json({
    event: {
      ...event,
      date: event.date.toISOString().slice(0, 10),
    },
  });
});

adminRouter.patch("/events/:id", async (req, res) => {
  const id = String(req.params.id ?? "").trim();
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Event not found." });
    return;
  }

  const body = {
    ...(req.body ?? {}),
    brandId: req.body?.brandId ?? existing.brandId,
    title: req.body?.title ?? existing.title,
    summary: req.body?.summary ?? existing.summary,
    date: req.body?.date ?? existing.date.toISOString().slice(0, 10),
    time: req.body?.time ?? existing.time,
    venue: req.body?.venue ?? existing.venue,
    city: req.body?.city ?? existing.city,
    price: req.body?.price ?? existing.price,
    capacity: req.body?.capacity ?? existing.capacity,
    ticketsLeft: req.body?.ticketsLeft ?? existing.ticketsLeft,
    imageSrc: req.body?.imageSrc ?? existing.imageSrc,
    imageAlt: req.body?.imageAlt ?? existing.imageAlt,
    credits: req.body?.credits ?? existing.credits,
  } as Record<string, unknown>;

  const parsed = parseEventBody(body);
  if ("error" in parsed || !parsed.data) {
    res.status(400).json({ error: parsed.error ?? "Invalid event." });
    return;
  }

  const brand = await prisma.brand.findUnique({ where: { id: parsed.data.brandId } });
  if (!brand) {
    res.status(400).json({ error: "Brand not found." });
    return;
  }

  const event = await prisma.event.update({
    where: { id },
    data: parsed.data,
    include: { brand: { select: { id: true, name: true, slug: true } } },
  });

  res.json({
    event: {
      ...event,
      date: event.date.toISOString().slice(0, 10),
    },
  });
});

adminRouter.delete("/events/:id", async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Event not found." });
  }
});

adminRouter.get("/ads", async (_req, res) => {
  const ads = await prisma.ad.findMany({
    orderBy: { createdAt: "desc" },
    include: { brand: { select: { id: true, name: true, slug: true } } },
  });
  res.json({ ads });
});

adminRouter.delete("/ads/:id", async (req, res) => {
  await prisma.ad.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

adminRouter.get("/payouts", async (_req, res) => {
  const payouts = await prisma.payout.findMany({
    orderBy: { createdAt: "desc" },
    include: { brand: { select: { id: true, name: true, slug: true } } },
  });
  res.json({ payouts });
});

adminRouter.patch("/payouts/:id", async (req, res) => {
  const status = String(req.body?.status ?? "").trim();
  if (!["pending", "paid", "rejected"].includes(status)) {
    res.status(400).json({ error: "Status must be pending, paid, or rejected." });
    return;
  }
  const payout = await prisma.payout.update({
    where: { id: req.params.id },
    data: { status },
    include: {
      brand: {
        include: { users: { select: { email: true } } },
      },
    },
  });

  void sendPayoutStatusEmail({
    to: payout.brand.users.map((user) => user.email),
    brandName: payout.brand.name,
    amount: payout.amount,
    status: payout.status,
    note: payout.note ?? undefined,
  });

  res.json({ payout });
});

adminRouter.get("/platform-payouts", async (_req, res) => {
  const summary = await getPlatformPayoutSummary();
  res.json({ summary, payouts: summary.payouts });
});

adminRouter.post("/platform-payouts", async (req: AuthedRequest, res) => {
  const amount = Math.round(Number(req.body?.amount));
  if (!Number.isFinite(amount) || amount < 100) {
    res.status(400).json({ error: "Minimum platform payout is RWF 100." });
    return;
  }

  const summary = await getPlatformPayoutSummary();
  if (amount > summary.available) {
    res.status(400).json({
      error: `You can only withdraw up to ${summary.available.toLocaleString()} RWF available commission.`,
    });
    return;
  }

  const method = String(req.body?.method ?? "").trim().slice(0, 40) || null;
  const destination = String(req.body?.destination ?? "").trim().slice(0, 120) || null;
  const note = String(req.body?.note ?? "").trim().slice(0, 500) || null;
  const statusRaw = String(req.body?.status ?? "paid").trim();
  const status = ["pending", "paid"].includes(statusRaw) ? statusRaw : "paid";

  if (!destination) {
    res.status(400).json({
      error: "Add a destination (MoMo phone, bank account, or note where the money went).",
    });
    return;
  }

  const payout = await prisma.platformPayout.create({
    data: {
      amount,
      currency: "RWF",
      status,
      method,
      destination,
      note,
      createdById: req.auth?.type === "admin" ? req.auth.userId : null,
    },
  });

  const next = await getPlatformPayoutSummary();
  res.status(201).json({
    payout: {
      id: payout.id,
      amount: payout.amount,
      currency: payout.currency,
      status: payout.status,
      method: payout.method,
      destination: payout.destination,
      note: payout.note,
      createdById: payout.createdById,
      createdAt: payout.createdAt.toISOString(),
      updatedAt: payout.updatedAt.toISOString(),
    },
    summary: next,
  });
});

adminRouter.patch("/platform-payouts/:id", async (req, res) => {
  const id = String(req.params.id ?? "");
  const status = String(req.body?.status ?? "").trim();
  if (!["pending", "paid", "rejected"].includes(status)) {
    res.status(400).json({ error: "Status must be pending, paid, or rejected." });
    return;
  }

  const existing = await prisma.platformPayout.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Platform payout not found." });
    return;
  }

  // When marking pending→paid again, available already reserved pending; OK.
  // When rejecting a paid payout, money returns to available.
  if (status === "paid" && existing.status === "rejected") {
    const summary = await getPlatformPayoutSummary();
    // rejected amounts are not in pending/paidOut, so need available check
    if (existing.amount > summary.available) {
      res.status(400).json({
        error: `Only ${summary.available.toLocaleString()} RWF available; cannot mark this payout paid.`,
      });
      return;
    }
  }

  const payout = await prisma.platformPayout.update({
    where: { id },
    data: { status },
  });

  const summary = await getPlatformPayoutSummary();
  res.json({
    payout: {
      id: payout.id,
      amount: payout.amount,
      currency: payout.currency,
      status: payout.status,
      method: payout.method,
      destination: payout.destination,
      note: payout.note,
      createdById: payout.createdById,
      createdAt: payout.createdAt.toISOString(),
      updatedAt: payout.updatedAt.toISOString(),
    },
    summary,
  });
});

adminRouter.get("/admins", async (req: AuthedRequest, res) => {
  const admins = await prisma.superAdmin.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  res.json({
    admins,
    currentId: req.auth?.type === "admin" ? req.auth.userId : null,
  });
});

adminRouter.post("/admins", async (req: AuthedRequest, res) => {
  const name = String(req.body?.name ?? "").trim();
  const email = String(req.body?.email ?? "")
    .toLowerCase()
    .trim();
  const password = String(req.body?.password ?? "");

  if (!name || !email.includes("@") || password.length < 6) {
    res.status(400).json({
      error: "Name, a valid email, and a password of at least 6 characters are required.",
    });
    return;
  }

  const exists = await prisma.superAdmin.findUnique({ where: { email } });
  if (exists) {
    res.status(409).json({ error: "An admin with that email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.superAdmin.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  res.status(201).json({ admin });
});

adminRouter.delete("/admins/:id", async (req: AuthedRequest, res) => {
  const id = String(req.params.id ?? "").trim();
  if (!id) {
    res.status(400).json({ error: "Admin id is required." });
    return;
  }
  if (req.auth?.type === "admin" && req.auth.userId === id) {
    res.status(400).json({ error: "You cannot remove your own admin account." });
    return;
  }

  const count = await prisma.superAdmin.count();
  if (count <= 1) {
    res.status(400).json({ error: "At least one super admin must remain." });
    return;
  }

  try {
    await prisma.superAdmin.delete({ where: { id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Admin not found." });
  }
});

/** Set or reset another (or your own) super admin password from the team page. */
adminRouter.patch("/admins/:id/password", async (req: AuthedRequest, res) => {
  const id = String(req.params.id ?? "").trim();
  const nextPassword = String(req.body?.password ?? req.body?.nextPassword ?? "");
  const confirmPassword = String(req.body?.confirm ?? "");
  const yourPassword = String(req.body?.yourPassword ?? "");

  if (!id) {
    res.status(400).json({ error: "Admin id is required." });
    return;
  }
  if (nextPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters." });
    return;
  }
  if (confirmPassword && confirmPassword !== nextPassword) {
    res.status(400).json({ error: "New passwords do not match." });
    return;
  }
  if (!yourPassword) {
    res.status(400).json({
      error: "Enter your current password to confirm this change.",
    });
    return;
  }

  const actorId = req.auth?.type === "admin" ? req.auth.userId : null;
  if (!actorId) {
    res.status(401).json({ error: "Admin login required." });
    return;
  }

  const [actor, target] = await Promise.all([
    prisma.superAdmin.findUnique({ where: { id: actorId } }),
    prisma.superAdmin.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!actor) {
    res.status(401).json({ error: "Admin login required." });
    return;
  }
  if (!(await bcrypt.compare(yourPassword, actor.passwordHash))) {
    res.status(400).json({ error: "Your current password is incorrect." });
    return;
  }
  if (!target) {
    res.status(404).json({ error: "Admin not found." });
    return;
  }
  if (await bcrypt.compare(nextPassword, actor.passwordHash) && actor.id === target.id) {
    res.status(400).json({
      error: "New password must be different from the current one.",
    });
    return;
  }

  await prisma.superAdmin.update({
    where: { id: target.id },
    data: { passwordHash: await bcrypt.hash(nextPassword, 10) },
  });

  const self = actor.id === target.id;
  if (self) {
    clearAuthCookie(res);
    res.json({
      ok: true,
      self: true,
      reLogin: true,
      redirectTo: `/login?changed=1&email=${encodeURIComponent(target.email)}&next=${encodeURIComponent("/admin")}`,
      message: "Password updated. Sign in again with the new password.",
    });
    return;
  }

  res.json({
    ok: true,
    self: false,
    admin: target,
    message: `Password updated for ${target.name}. They can sign in with the new password.`,
  });
});

adminRouter.get("/legal", async (_req, res) => {
  const pages = await listLegalPages();
  res.json({ pages });
});

adminRouter.get("/site-settings", async (_req, res) => {
  const settings = await getSiteSettings();
  res.json({ settings });
});

adminRouter.patch("/site-settings", async (req, res) => {
  const body =
    req.body && typeof req.body === "object"
      ? (req.body as Record<string, unknown>)
      : {};
  const parsed = parseSiteSettingsPatch(body);
  if (parsed.error || !parsed.data) {
    res.status(400).json({ error: parsed.error ?? "Invalid payload." });
    return;
  }
  const settings = await updateSiteSettings(parsed.data);
  res.json({ settings });
});

adminRouter.get("/orders", async (_req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true },
  });
  res.json({ orders: orders.map(mapOrder) });
});

adminRouter.patch("/orders/:reference", async (req, res) => {
  const status = String(req.body?.status ?? "").trim();
  if (!isOrderStatus(status)) {
    res.status(400).json({ error: "Invalid status." });
    return;
  }

  const data = buildOrderStatusUpdate({
    status,
    trackingCode: req.body?.trackingCode,
    carrier: req.body?.carrier,
    patchTracking: req.body?.trackingCode !== undefined,
    patchCarrier: req.body?.carrier !== undefined,
  });

  try {
    const order = await prisma.order.update({
      where: { reference: String(req.params.reference).toUpperCase() },
      data,
      include: { items: true },
    });

    const mapped = mapOrder(order);

    void notifyOrderStatusChange({
      email: order.email,
      customerName: order.customerName,
      reference: order.reference,
      status: order.status,
      trackingCode: order.trackingCode,
      carrier: order.carrier,
      items: order.items.map((item) => ({
        brandId: item.brandId,
        brandName: item.brandName,
        productId: item.productId,
        kind: item.kind,
      })),
    }).catch((err) => console.error("[admin] order status mail", err));

    res.json({ order: mapped });
  } catch {
    res.status(404).json({ error: "Order not found." });
  }
});

adminRouter.get("/coupons", async (_req, res) => {
  const coupons = await prisma.coupon.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });
  res.json({ coupons: coupons.map(mapCoupon) });
});

adminRouter.post("/coupons", async (req, res) => {
  const parsed = validateCouponFields(req.body ?? {});
  if ("error" in parsed || !parsed.data) {
    res.status(400).json({ error: parsed.error ?? "Invalid coupon." });
    return;
  }

  const existing = await prisma.coupon.findUnique({
    where: { code: parsed.data.code },
  });
  if (existing) {
    res.status(409).json({ error: "That coupon code already exists." });
    return;
  }

  const coupon = await prisma.coupon.create({ data: parsed.data });
  res.status(201).json({ coupon: mapCoupon(coupon) });
});

adminRouter.patch("/coupons/:id", async (req, res) => {
  const id = String(req.params.id ?? "").trim();
  const current = await prisma.coupon.findUnique({ where: { id } });
  if (!current) {
    res.status(404).json({ error: "Coupon not found." });
    return;
  }

  const parsed = validateCouponFields({
    code: req.body?.code ?? current.code,
    type: req.body?.type ?? current.type,
    value: req.body?.value ?? current.value,
    minSubtotal: req.body?.minSubtotal ?? current.minSubtotal,
    maxDiscount:
      req.body?.maxDiscount !== undefined
        ? req.body.maxDiscount
        : current.maxDiscount,
    maxUses:
      req.body?.maxUses !== undefined ? req.body.maxUses : current.maxUses,
    startsAt:
      req.body?.startsAt !== undefined
        ? req.body.startsAt
        : current.startsAt?.toISOString() ?? "",
    endsAt:
      req.body?.endsAt !== undefined
        ? req.body.endsAt
        : current.endsAt?.toISOString() ?? "",
    active: req.body?.active !== undefined ? req.body.active : current.active,
    description:
      req.body?.description !== undefined
        ? req.body.description
        : current.description,
  });
  if ("error" in parsed || !parsed.data) {
    res.status(400).json({ error: parsed.error ?? "Invalid coupon." });
    return;
  }

  if (parsed.data.code !== current.code) {
    const clash = await prisma.coupon.findUnique({
      where: { code: parsed.data.code },
    });
    if (clash) {
      res.status(409).json({ error: "That coupon code already exists." });
      return;
    }
  }

  const coupon = await prisma.coupon.update({
    where: { id },
    data: parsed.data,
  });
  res.json({ coupon: mapCoupon(coupon) });
});

adminRouter.delete("/coupons/:id", async (req, res) => {
  const id = String(req.params.id ?? "").trim();
  try {
    await prisma.coupon.delete({ where: { id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Coupon not found." });
  }
});

adminRouter.post("/coupons/:id/toggle", async (req, res) => {
  const id = String(req.params.id ?? "").trim();
  const current = await prisma.coupon.findUnique({ where: { id } });
  if (!current) {
    res.status(404).json({ error: "Coupon not found." });
    return;
  }
  const coupon = await prisma.coupon.update({
    where: { id },
    data: { active: !current.active },
  });
  res.json({ coupon: mapCoupon(coupon) });
});

adminRouter.get("/legal/:id", async (req, res) => {
  const id = String(req.params.id ?? "").toLowerCase();
  if (!isLegalId(id)) {
    res.status(404).json({ error: "Legal page not found." });
    return;
  }
  const page = await getLegalPage(id);
  res.json({ page });
});

adminRouter.patch("/legal/:id", async (req, res) => {
  const id = String(req.params.id ?? "").toLowerCase();
  if (!isLegalId(id)) {
    res.status(404).json({ error: "Legal page not found." });
    return;
  }
  const title = String(req.body?.title ?? "").trim().slice(0, 200);
  const body = String(req.body?.body ?? "").trim();
  if (!title || !body) {
    res.status(400).json({ error: "Title and body are required." });
    return;
  }
  if (body.length > 100_000) {
    res.status(400).json({ error: "Body is too long." });
    return;
  }

  const page = await prisma.legalPage.upsert({
    where: { id },
    update: { title, body },
    create: { id, title, body },
  });

  res.json({
    page: {
      id: page.id,
      title: page.title,
      body: page.body,
      updatedAt: page.updatedAt.toISOString(),
    },
  });
});
