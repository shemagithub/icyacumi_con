import { Router } from "express";
import { prisma } from "../lib/db.js";
import { mapAd, mapBrand, mapEvent, mapProduct } from "../lib/mappers.js";
import {
  asJsonLines,
  makeOrderReference,
  makeToken,
  mapOrder,
  shippingForSubtotal,
  type SharedCartLine,
} from "../lib/orders.js";
import { readAuthFromCookie, AUTH_COOKIE } from "../lib/auth.js";
import { getLegalPage, isLegalId } from "../lib/legal.js";
import { getSiteSettings } from "../lib/site-settings.js";
import { quoteCoupon, redeemCoupon } from "../lib/coupons.js";
import { consumeInventory } from "../lib/inventory.js";
import { notifyBrandsOfSale } from "../lib/brand-notifications.js";

export const catalogRouter = Router();

type OrderLineIn = {
  name?: string;
  quantity?: number;
  unitAmount?: number;
  brandId?: string;
  brandName?: string;
  meta?: string;
  productId?: string;
  kind?: string;
};

async function resolveReceiptLine(line: OrderLineIn): Promise<{
  productId: string | null;
  kind: "product" | "ticket";
  name: string;
  slug: string;
  size: string;
  color: string;
  quantity: number;
  unitAmount: number;
  brandId: string | null;
  brandName: string | null;
}> {
  const quantity = Math.max(1, Math.round(Number(line.quantity) || 1));
  const unitAmount = Math.max(0, Math.round(Number(line.unitAmount) || 0));
  const name = String(line.name ?? "Item").slice(0, 200);
  const meta = String(line.meta ?? "");
  let productId =
    typeof line.productId === "string" && line.productId.trim()
      ? line.productId.trim()
      : null;
  let brandId =
    typeof line.brandId === "string" && line.brandId.trim()
      ? line.brandId.trim()
      : null;
  let brandName =
    typeof line.brandName === "string" && line.brandName.trim()
      ? line.brandName.trim()
      : null;

  const kindHint = String((line as { kind?: string }).kind ?? "").toLowerCase();
  const looksLikeTicket =
    kindHint === "ticket" ||
    meta.toLowerCase().includes("ticket") ||
    name.toLowerCase().includes("- ticket") ||
    name.toLowerCase().includes("- ticket");

  let kind: "product" | "ticket" = looksLikeTicket ? "ticket" : "product";

  if (productId && kind === "ticket") {
    const event = await prisma.event.findUnique({
      where: { id: productId },
      include: { brand: { select: { id: true, name: true } } },
    });
    if (event) {
      brandId = brandId || event.brandId;
      brandName = brandName || event.brand.name;
      return {
        productId: event.id,
        kind: "ticket",
        name,
        slug: event.slug,
        size: "OS",
        color: "Ticket",
        quantity,
        unitAmount,
        brandId,
        brandName,
      };
    }
  }

  if (productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { brand: { select: { id: true, name: true } } },
    });
    if (product) {
      brandId = brandId || product.brandId;
      brandName = brandName || product.brand.name;
      kind = "product";
      return {
        productId: product.id,
        kind,
        name,
        slug: product.slug,
        size: "-",
        color: meta.slice(0, 80) || "-",
        quantity,
        unitAmount,
        brandId,
        brandName,
      };
    }
    // productId may actually be an event id without ticket hint
    const event = await prisma.event.findUnique({
      where: { id: productId },
      include: { brand: { select: { id: true, name: true } } },
    });
    if (event) {
      return {
        productId: event.id,
        kind: "ticket",
        name,
        slug: event.slug,
        size: "OS",
        color: "Ticket",
        quantity,
        unitAmount,
        brandId: brandId || event.brandId,
        brandName: brandName || event.brand.name,
      };
    }
  }

  return {
    productId,
    kind,
    name,
    slug: String(productId ?? "item").slice(0, 160),
    size: kind === "ticket" ? "OS" : "-",
    color: kind === "ticket" ? "Ticket" : meta.slice(0, 80) || "-",
    quantity,
    unitAmount,
    brandId,
    brandName,
  };
}

/** Preview a coupon against a cart (prices resolved server-side). */
catalogRouter.post("/coupons/validate", async (req, res) => {
  const code = String(req.body?.code ?? "");
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];

  if (!rawItems.length) {
    const subtotal = Math.max(0, Math.round(Number(req.body?.subtotal) || 0));
    if (!subtotal) {
      res.status(400).json({ error: "Add items before applying a coupon." });
      return;
    }
    const quote = await quoteCoupon({ code, subtotal });
    if (!quote.ok) {
      res.status(400).json({ error: quote.error });
      return;
    }
    res.json(quote);
    return;
  }

  const priced = await resolvePricedLines(
    rawItems as Array<Record<string, unknown>>,
  );
  if ("error" in priced) {
    res.status(400).json({ error: priced.error });
    return;
  }
  const subtotal = priced.lines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );
  const quote = await quoteCoupon({ code, subtotal });
  if (!quote.ok) {
    res.status(400).json({ error: quote.error });
    return;
  }
  res.json(quote);
});


async function resolvePricedLines(
  rawLines: Array<Record<string, unknown>>,
): Promise<{ lines: SharedCartLine[] } | { error: string }> {
  const lines: SharedCartLine[] = [];
  const remainingProduct = new Map<string, number>();
  const remainingTickets = new Map<string, number>();

  for (const raw of rawLines.slice(0, 40)) {
    const productId = String(raw.productId ?? "").trim();
    const quantity = Math.max(1, Math.min(99, Math.round(Number(raw.quantity) || 1)));
    const size = String(raw.size ?? "OS").slice(0, 20);
    const color = String(raw.color ?? "").slice(0, 80);
    const kind =
      raw.kind === "ticket" || color === "Ticket" ? "ticket" : "product";

    if (!productId) {
      return { error: "Invalid cart lines." };
    }

    if (kind === "ticket") {
      const event = await prisma.event.findUnique({
        where: { id: productId },
        include: { brand: { select: { name: true } } },
      });
      if (!event) return { error: "An event ticket is no longer available." };
      let left = remainingTickets.get(event.id);
      if (left === undefined) {
        left = event.ticketsLeft;
        remainingTickets.set(event.id, left);
      }
      if (left <= 0) {
        return { error: `${event.title} is sold out.` };
      }
      if (quantity > left) {
        return { error: `Only ${left} tickets left for ${event.title}.` };
      }
      remainingTickets.set(event.id, left - quantity);

      lines.push({
        id: String(raw.id ?? `${productId}:OS:Ticket`),
        productId: event.id,
        slug: event.slug,
        name: `${event.title} · ticket`,
        price: event.price,
        size: "OS",
        color: "Ticket",
        quantity,
        kind: "ticket",
        brandId: event.brandId,
        brandName: event.brand?.name ?? null,
        image: {
          src: event.imageSrc,
          alt: event.imageAlt || event.title,
        },
      });
      continue;
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { brand: { select: { name: true } } },
    });
    if (!product) return { error: "A product in the bag is no longer available." };

    let left = remainingProduct.get(product.id);
    if (left === undefined) {
      left =
        product.inStock && product.stockQuantity > 0 ? product.stockQuantity : 0;
      remainingProduct.set(product.id, left);
    }
    if (left <= 0) {
      return { error: `${product.name} is sold out.` };
    }
    if (quantity > left) {
      return {
        error: `Only ${left} left in stock for ${product.name}.`,
      };
    }
    remainingProduct.set(product.id, left - quantity);

    const sizes = Array.isArray(product.sizes)
      ? (product.sizes as unknown[]).map(String)
      : [];
    if (sizes.length && !sizes.includes(size)) {
      return { error: `${product.name} isn’t available in size ${size}.` };
    }

    const colors = Array.isArray(product.colors)
      ? (product.colors as Array<{ name?: string }>)
      : [];
    const colorNames = colors
      .map((entry) => String(entry?.name ?? "").trim())
      .filter(Boolean);
    const resolvedColor = colorNames.includes(color)
      ? color
      : colorNames[0] || color || "-";
    if (color && colorNames.length && !colorNames.includes(color)) {
      return { error: `${product.name} isn’t available in ${color}.` };
    }

    const images = Array.isArray(product.images) ? product.images : [];
    const firstImage =
      images[0] && typeof images[0] === "object"
        ? (images[0] as { src?: string; alt?: string })
        : null;

    lines.push({
      id: String(raw.id ?? `${productId}:${size}:${resolvedColor}`),
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      size,
      color: resolvedColor,
      quantity,
      kind: "product",
      brandId: product.brandId,
      brandName: product.brand?.name ?? null,
      image: {
        src: String(firstImage?.src ?? ""),
        alt: String(firstImage?.alt ?? product.name),
      },
    });
  }

  if (!lines.length) return { error: "Cart is empty." };
  return { lines };
}

catalogRouter.get("/health", (_req, res) => {
  res.json({ ok: true, service: "bone-koboyi-backend" });
});

catalogRouter.get("/legal/:id", async (req, res) => {
  const id = String(req.params.id ?? "").toLowerCase();
  if (!isLegalId(id)) {
    res.status(404).json({ error: "Legal page not found." });
    return;
  }
  const page = await getLegalPage(id);
  res.json({ page });
});

catalogRouter.get("/site-settings", async (_req, res) => {
  const settings = await getSiteSettings();
  res.json({ settings });
});

catalogRouter.get("/brands", async (_req, res) => {
  const rows = await prisma.brand.findMany({
    where: { status: "approved" },
    orderBy: { name: "asc" },
  });
  res.json({ brands: rows.map(mapBrand) });
});

catalogRouter.get("/brands/id/:id", async (req, res) => {
  const row = await prisma.brand.findUnique({ where: { id: req.params.id } });
  if (!row || row.status !== "approved") {
    res.status(404).json({ error: "Brand not found" });
    return;
  }
  res.json({ brand: mapBrand(row) });
});

catalogRouter.get("/brands/:slug", async (req, res) => {
  const row = await prisma.brand.findUnique({ where: { slug: req.params.slug } });
  if (!row || row.status !== "approved") {
    res.status(404).json({ error: "Brand not found" });
    return;
  }
  res.json({ brand: mapBrand(row) });
});

catalogRouter.get("/products", async (req, res) => {
  const vendor = typeof req.query.vendor === "string" ? req.query.vendor : undefined;
  const sort = typeof req.query.sort === "string" ? req.query.sort : "views";

  const rows = await prisma.product.findMany({
    where: vendor ? { brandId: vendor } : undefined,
    include: { brand: true },
  });

  let products = rows.map((row) =>
    mapProduct(row, {
      name: row.brand.name,
      slug: row.brand.slug,
      location: row.brand.location,
    }),
  );
  if (sort === "price-asc") products.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") products.sort((a, b) => b.price - a.price);
  else if (sort === "name-asc") products.sort((a, b) => a.name.localeCompare(b.name));
  else products.sort((a, b) => b.views - a.views || a.name.localeCompare(b.name));

  res.json({ products });
});

catalogRouter.get("/products/:slug", async (req, res) => {
  const row = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: { brand: true },
  });
  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({
    product: mapProduct(row, {
      name: row.brand.name,
      slug: row.brand.slug,
      location: row.brand.location,
    }),
  });
});

catalogRouter.get("/events", async (_req, res) => {
  const rows = await prisma.event.findMany({ orderBy: { date: "asc" } });
  res.json({ events: rows.map(mapEvent) });
});

catalogRouter.get("/search", async (req, res) => {
  const q = String(req.query.q ?? "")
    .trim()
    .slice(0, 80);
  if (q.length < 1) {
    res.json({ query: q, products: [], brands: [], events: [], ads: [] });
    return;
  }

  const tokens = q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);

  function matches(...fields: Array<string | null | undefined>) {
    const hay = fields
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return tokens.every((token) => hay.includes(token));
  }

  const [productRows, brandRows, eventRows, adRows] = await Promise.all([
    prisma.product.findMany({
      where: { brand: { status: "approved" } },
      include: { brand: true },
      take: 80,
      orderBy: { views: "desc" },
    }),
    prisma.brand.findMany({
      where: { status: "approved" },
      take: 40,
      orderBy: { name: "asc" },
    }),
    prisma.event.findMany({ take: 40, orderBy: { date: "asc" } }),
    prisma.ad.findMany({
      where: { brand: { status: "approved" } },
      include: { brand: true },
      take: 40,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const products = productRows
    .filter((row) =>
      matches(
        row.name,
        row.tagline,
        row.description,
        row.category,
        row.fabric,
        row.brand.name,
        row.brand.location,
        row.brand.slug,
      ),
    )
    .slice(0, 6)
    .map((row) =>
      mapProduct(row, {
        name: row.brand.name,
        slug: row.brand.slug,
        location: row.brand.location,
      }),
    );

  const brands = brandRows
    .filter((row) =>
      matches(row.name, row.shortBio, row.location, row.slug),
    )
    .slice(0, 5)
    .map(mapBrand);

  const events = eventRows
    .filter((row) =>
      matches(row.title, row.summary, row.venue, row.city, row.slug),
    )
    .slice(0, 5)
    .map(mapEvent);

  const ads = adRows
    .filter((row) =>
      matches(row.title, row.summary, row.type, row.brand.name, row.slug),
    )
    .slice(0, 4)
    .map(mapAd);

  res.json({ query: q, products, brands, events, ads });
});

catalogRouter.get("/events/:slug", async (req, res) => {
  const row = await prisma.event.findUnique({ where: { slug: req.params.slug } });
  if (!row) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json({ event: mapEvent(row) });
});

catalogRouter.get("/ads", async (req, res) => {
  const featuredOnly = req.query.featured === "1" || req.query.featured === "true";
  const rows = await prisma.ad.findMany({
    where: featuredOnly ? { featured: true } : undefined,
    include: { brand: true },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ ads: rows.map(mapAd) });
});

catalogRouter.post("/contact", async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  const email = String(req.body?.email ?? "")
    .toLowerCase()
    .trim();
  const subject = String(req.body?.subject ?? "").trim();
  const message = String(req.body?.message ?? "").trim();

  if (!name || !email.includes("@") || !subject || message.length < 3) {
    res.status(400).json({ error: "Name, email, subject, and message are required." });
    return;
  }

  const { sendContactNotification } = await import("../lib/mail.js");
  const result = await sendContactNotification({ name, email, subject, message });
  if (!result.ok && !result.skipped) {
    res.status(502).json({ error: "Could not send your message. Try again shortly." });
    return;
  }
  res.json({ ok: true, mailed: Boolean(result.ok && !result.skipped) });
});

catalogRouter.post("/newsletter", async (req, res) => {
  const email = String(req.body?.email ?? "")
    .toLowerCase()
    .trim();
  const source = String(req.body?.source ?? "site")
    .trim()
    .slice(0, 40) || "site";

  if (!email.includes("@") || email.length > 255) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });
    if (existing) {
      res.json({ ok: true, alreadySubscribed: true });
      return;
    }

    await prisma.newsletterSubscriber.create({
      data: { email, source },
    });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "P2002") {
      res.json({ ok: true, alreadySubscribed: true });
      return;
    }
    console.error("[newsletter]", error);
    res.status(500).json({ error: "Could not subscribe. Try again shortly." });
    return;
  }

  void import("../lib/mail.js")
    .then(({ sendNewsletterWelcome }) => sendNewsletterWelcome({ email }))
    .catch((err) => console.error("[newsletter] welcome mail", err));

  res.json({ ok: true, alreadySubscribed: false });
});

catalogRouter.post("/order-receipt", async (req, res) => {
  const email = String(req.body?.email ?? "")
    .toLowerCase()
    .trim();
  const reference = String(req.body?.reference ?? "").trim();
  const customerName = String(req.body?.customerName ?? "").trim() || undefined;
  const shippingAddress = String(req.body?.shippingAddress ?? "").trim() || undefined;
  const shipping = Number(req.body?.shipping);
  const total = Number(req.body?.total);
  const discountRaw = Number(req.body?.discount);
  const discount = Number.isFinite(discountRaw) ? Math.max(0, Math.round(discountRaw)) : 0;
  const couponCode =
    typeof req.body?.couponCode === "string"
      ? String(req.body.couponCode).trim().toUpperCase() || null
      : null;
  const couponId =
    typeof req.body?.couponId === "string"
      ? String(req.body.couponId).trim() || null
      : null;
  const lines = Array.isArray(req.body?.lines) ? (req.body.lines as OrderLineIn[]) : [];

  if (!email.includes("@") || !reference || !lines.length || !Number.isFinite(total)) {
    res.status(400).json({ error: "Invalid order receipt payload." });
    return;
  }

  const receiptLines = lines.map((line) => ({
    name: String(line.name ?? "Item"),
    quantity: Math.max(1, Math.round(Number(line.quantity) || 1)),
    unitAmount: Math.max(0, Math.round(Number(line.unitAmount) || 0)),
    brandName: line.brandName ? String(line.brandName) : undefined,
    meta: line.meta ? String(line.meta) : undefined,
  }));

  const { sendOrderReceiptEmail } = await import("../lib/mail.js");

  await sendOrderReceiptEmail({
    to: email,
    customerName,
    reference,
    lines: receiptLines,
    shipping: Number.isFinite(shipping) ? shipping : undefined,
    discount,
    couponCode,
    total: Math.round(total),
    shippingAddress,
    paymentMethod: "card",
    paidAt: new Date(),
  });

  // Persist order for delivery tracking (idempotent on stripe session / reference).
  const stripeSessionId =
    typeof req.body?.stripeSessionId === "string"
      ? req.body.stripeSessionId.trim()
      : null;
  const sharedCartToken =
    typeof req.body?.sharedCartToken === "string"
      ? req.body.sharedCartToken.trim()
      : null;
  const clientId =
    typeof req.body?.clientId === "string" ? req.body.clientId.trim() : null;

  let order = stripeSessionId
    ? await prisma.order.findUnique({
        where: { stripeSessionId },
        include: { items: true },
      })
    : null;

  if (!order) {
    const orderReference =
      typeof reference === "string" && reference.startsWith("BK-")
        ? reference
        : makeOrderReference();

    const resolvedItems = await Promise.all(lines.map((line) => resolveReceiptLine(line)));

    order = await prisma.order.create({
      data: {
        reference: orderReference,
        clientId,
        email,
        customerName: customerName ?? "Customer",
        phone:
          typeof req.body?.phone === "string" ? req.body.phone.trim() : null,
        shippingAddress,
        status: "paid",
        subtotal: Math.max(
          0,
          Math.round(total) -
            (Number.isFinite(shipping) ? Math.round(shipping) : 0) +
            discount,
        ),
        discount,
        shipping: Number.isFinite(shipping) ? Math.round(shipping) : 0,
        total: Math.round(total),
        currency: "RWF",
        couponCode,
        couponId,
        paymentMethod: "card",
        stripeSessionId,
        sharedCartToken: sharedCartToken || null,
        paidAt: new Date(),
        items: {
          create: resolvedItems.map((item) => ({
            productId: item.productId,
            kind: item.kind,
            name: item.name,
            slug: item.slug,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unitAmount: item.unitAmount,
            brandId: item.brandId,
            brandName: item.brandName,
          })),
        },
      },
      include: { items: true },
    });

    if (couponId) {
      await redeemCoupon(couponId);
    }

    await consumeInventory(
      order.items.map((item) => ({
        productId: item.productId,
        kind: item.kind,
        quantity: item.quantity,
      })),
    );

    void notifyBrandsOfSale(order).catch((err) =>
      console.error("[order-receipt] brand sale mail", err),
    );
  }

  if (sharedCartToken) {
    await prisma.sharedCart.updateMany({
      where: { token: sharedCartToken, status: "open" },
      data: { status: "paid", paidOrderId: order.id },
    });
  }

  res.json({ ok: true, order: mapOrder(order) });
});

catalogRouter.post("/shared-carts", async (req, res) => {
  const rawLines = Array.isArray(req.body?.lines) ? req.body.lines : [];
  if (!rawLines.length) {
    res.status(400).json({ error: "Cart is empty." });
    return;
  }

  const priced = await resolvePricedLines(rawLines as Array<Record<string, unknown>>);
  if ("error" in priced) {
    res.status(400).json({ error: priced.error });
    return;
  }
  const lines = priced.lines;

  const token = req.cookies?.[AUTH_COOKIE] as string | undefined;
  const session = await readAuthFromCookie(token);

  let tokenValue = makeToken(12);
  for (let i = 0; i < 3; i += 1) {
    const exists = await prisma.sharedCart.findUnique({ where: { token: tokenValue } });
    if (!exists) break;
    tokenValue = makeToken(12);
  }

  const shared = await prisma.sharedCart.create({
    data: {
      token: tokenValue,
      ownerClientId: session?.type === "client" ? session.userId : null,
      ownerName:
        String(req.body?.ownerName ?? "").trim() ||
        (session?.type === "client" ? session.name : null),
      ownerEmail:
        String(req.body?.ownerEmail ?? "").trim().toLowerCase() ||
        (session?.type === "client" ? session.email : null),
      message: String(req.body?.message ?? "").trim().slice(0, 500) || null,
      lines: asJsonLines(lines),
      status: "open",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  res.status(201).json({
    sharedCart: {
      token: shared.token,
      status: shared.status,
      expiresAt: shared.expiresAt.toISOString(),
      ownerName: shared.ownerName,
      message: shared.message,
      lines,
      path: `/pay/${shared.token}`,
    },
  });
});

catalogRouter.get("/shared-carts/:token", async (req, res) => {
  const shared = await prisma.sharedCart.findUnique({
    where: { token: String(req.params.token) },
  });
  if (!shared) {
    res.status(404).json({ error: "Shared bag not found." });
    return;
  }
  if (shared.expiresAt.getTime() < Date.now() && shared.status === "open") {
    await prisma.sharedCart.update({
      where: { id: shared.id },
      data: { status: "expired" },
    });
    shared.status = "expired";
  }

  res.json({
    sharedCart: {
      token: shared.token,
      status: shared.status,
      expiresAt: shared.expiresAt.toISOString(),
      ownerName: shared.ownerName,
      ownerEmail: shared.ownerEmail,
      message: shared.message,
      lines: shared.lines,
      paidOrderId: shared.paidOrderId,
    },
  });
});

function normalizePaymentMethod(raw: unknown): "card" | "mtn" | "airtel" {
  const value = String(raw ?? "")
    .toLowerCase()
    .trim();
  if (value === "mtn" || value === "momo" || value === "mtn_momo") return "mtn";
  if (value === "airtel" || value === "airtel_money") return "airtel";
  return "card";
}

function paymentMethodLabel(method: "card" | "mtn" | "airtel") {
  if (method === "mtn") return "MTN MoMo";
  if (method === "airtel") return "Airtel Money";
  return "Card";
}

/** Demo / no-Stripe completion of a shared cart payment. */
catalogRouter.post("/shared-carts/:token/complete", async (req, res) => {
  const token = String(req.params.token ?? "").trim();
  const shared = await prisma.sharedCart.findUnique({ where: { token } });
  if (!shared) {
    res.status(404).json({ error: "Shared bag not found." });
    return;
  }
  if (shared.status === "paid" && shared.paidOrderId) {
    const existing = await prisma.order.findUnique({
      where: { id: shared.paidOrderId },
      include: { items: true },
    });
    if (existing) {
      res.json({ order: mapOrder(existing) });
      return;
    }
  }
  if (shared.status !== "open") {
    res.status(409).json({ error: "This shared bag is no longer open for payment." });
    return;
  }
  if (shared.expiresAt.getTime() < Date.now()) {
    await prisma.sharedCart.update({
      where: { id: shared.id },
      data: { status: "expired" },
    });
    res.status(410).json({ error: "This share link has expired." });
    return;
  }

  const customer = req.body?.customer ?? {};
  const email = String(customer.email ?? "")
    .toLowerCase()
    .trim();
  const customerName = String(customer.name ?? "").trim();
  const paymentMethod = normalizePaymentMethod(req.body?.paymentMethod);
  if (!email.includes("@") || !customerName) {
    res.status(400).json({ error: "Name and email are required." });
    return;
  }
  if (
    (paymentMethod === "mtn" || paymentMethod === "airtel") &&
    !String(customer.phone ?? "").trim()
  ) {
    res.status(400).json({ error: "Mobile money needs a phone number." });
    return;
  }

  const storedLines = (Array.isArray(shared.lines) ? shared.lines : []) as SharedCartLine[];
  if (!storedLines.length) {
    res.status(400).json({ error: "Shared bag has no items." });
    return;
  }

  const priced = await resolvePricedLines(
    storedLines.map((line) => ({ ...line }) as unknown as Record<string, unknown>),
  );
  if ("error" in priced) {
    res.status(400).json({ error: priced.error });
    return;
  }
  const lines = priced.lines;

  const subtotal = lines.reduce(
    (sum, line) => sum + Math.max(0, line.price) * Math.max(1, line.quantity),
    0,
  );

  let discount = 0;
  let shipping = shippingForSubtotal(subtotal);
  let couponId: string | null = null;
  let couponCode: string | null = null;
  const couponRaw = String(req.body?.couponCode ?? "").trim();
  if (couponRaw) {
    const quote = await quoteCoupon({ code: couponRaw, subtotal });
    if (!quote.ok) {
      res.status(400).json({ error: quote.error });
      return;
    }
    discount = quote.discount;
    shipping = quote.shipping;
    couponId = quote.coupon.id;
    couponCode = quote.coupon.code;
  }
  const total = Math.max(0, subtotal - discount + shipping);

  const shippingAddress = [
    String(customer.line1 ?? "").trim(),
    String(customer.line2 ?? "").trim(),
    String(customer.city ?? "").trim(),
    String(customer.state ?? "").trim(),
    String(customer.postalCode ?? "").trim(),
    String(customer.country ?? "").trim(),
  ]
    .filter(Boolean)
    .join(", ");

  const authToken = req.cookies?.[AUTH_COOKIE] as string | undefined;
  const session = await readAuthFromCookie(authToken);
  const payerClientId = session?.type === "client" ? session.userId : null;

  const reference = makeOrderReference();
  const order = await prisma.order.create({
    data: {
      reference,
      clientId: shared.ownerClientId ?? payerClientId,
      email: shared.ownerEmail || email,
      customerName: shared.ownerName || customerName,
      phone: String(customer.phone ?? "").trim() || null,
      shippingAddress: shippingAddress || null,
      status: "paid",
      subtotal,
      discount,
      shipping,
      total,
      currency: "RWF",
      couponCode,
      couponId,
      paymentMethod,
      sharedCartToken: token,
      notes:
        [
          shared.message ? `Gift note: ${shared.message}` : null,
          String(customer.notes ?? "").trim() || null,
          `Paid by: ${customerName} <${email}>`,
          `Paid via ${paymentMethodLabel(paymentMethod)}`,
          couponCode ? `Coupon ${couponCode}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
          .slice(0, 500) || null,
      paidAt: new Date(),
      items: {
        create: lines.map((line) => ({
          productId: line.productId || null,
          kind: line.kind === "ticket" ? "ticket" : "product",
          name: String(line.name).slice(0, 200),
          slug: String(line.slug || line.productId || "item").slice(0, 160),
          size: String(line.size || "OS").slice(0, 20),
          color: String(line.color || "-").slice(0, 80),
          quantity: Math.max(1, line.quantity),
          unitAmount: Math.max(0, line.price),
          imageSrc: line.image?.src?.slice(0, 255) ?? null,
          brandId: line.brandId ?? null,
          brandName: line.brandName ?? null,
        })),
      },
    },
    include: { items: true },
  });

  await prisma.sharedCart.update({
    where: { id: shared.id },
    data: { status: "paid", paidOrderId: order.id },
  });

  if (couponId) {
    await redeemCoupon(couponId);
  }

  await consumeInventory(
    order.items.map((item) => ({
      productId: item.productId,
      kind: item.kind,
      quantity: item.quantity,
    })),
  );

  try {
    const { sendOrderReceiptEmail } = await import("../lib/mail.js");
    await sendOrderReceiptEmail({
      to: order.email,
      customerName: order.customerName,
      reference: order.reference,
      lines: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitAmount: item.unitAmount,
        meta: `${item.color} / ${item.size}`,
      })),
      shipping: order.shipping,
      discount: order.discount,
      couponCode: order.couponCode,
      total: order.total,
      shippingAddress: order.shippingAddress ?? undefined,
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt,
    });
  } catch {
    // Non-blocking if mail fails.
  }

  void notifyBrandsOfSale(order).catch((err) =>
    console.error("[shared-complete] brand sale mail", err),
  );

  res.status(201).json({ order: mapOrder(order) });
});

catalogRouter.get("/orders/track/:reference", async (req, res) => {
  const reference = String(req.params.reference ?? "")
    .trim()
    .toUpperCase();
  const email = String(req.query.email ?? "")
    .toLowerCase()
    .trim();

  const order = await prisma.order.findUnique({
    where: { reference },
    include: { items: true },
  });
  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  // Soft gate: if email provided, must match; if not, still allow reference-only track
  // but mask email.
  if (email && email !== order.email.toLowerCase()) {
    res.status(403).json({ error: "Email does not match this order." });
    return;
  }

  const mapped = mapOrder(order);
  if (!email) {
    mapped.email = maskEmail(order.email);
  }
  res.json({ order: mapped });
});

/** Demo / no-Stripe checkout for a normal bag (prices resolved server-side). */
catalogRouter.post("/orders/demo-complete", async (req, res) => {
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
  const customer = req.body?.customer ?? {};
  const email = String(customer.email ?? "")
    .toLowerCase()
    .trim();
  const customerName = String(customer.name ?? "").trim();
  const paymentMethod = normalizePaymentMethod(req.body?.paymentMethod);

  if (!email.includes("@") || !customerName) {
    res.status(400).json({ error: "Name and email are required." });
    return;
  }

  const priced = await resolvePricedLines(rawItems as Array<Record<string, unknown>>);
  if ("error" in priced) {
    res.status(400).json({ error: priced.error });
    return;
  }
  const lines = priced.lines;

  if ((paymentMethod === "mtn" || paymentMethod === "airtel") && !String(customer.phone ?? "").trim()) {
    res.status(400).json({ error: "Mobile money needs a phone number." });
    return;
  }

  const subtotal = lines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );

  let discount = 0;
  let shipping = shippingForSubtotal(subtotal);
  let couponId: string | null = null;
  let couponCode: string | null = null;
  const couponRaw = String(req.body?.couponCode ?? "").trim();
  if (couponRaw) {
    const quote = await quoteCoupon({ code: couponRaw, subtotal });
    if (!quote.ok) {
      res.status(400).json({ error: quote.error });
      return;
    }
    discount = quote.discount;
    shipping = quote.shipping;
    couponId = quote.coupon.id;
    couponCode = quote.coupon.code;
  }
  const total = Math.max(0, subtotal - discount + shipping);

  const shippingAddress = [
    String(customer.line1 ?? "").trim(),
    String(customer.line2 ?? "").trim(),
    String(customer.city ?? "").trim(),
    String(customer.state ?? "").trim(),
    String(customer.postalCode ?? "").trim(),
    String(customer.country ?? "").trim(),
  ]
    .filter(Boolean)
    .join(", ");

  const authToken = req.cookies?.[AUTH_COOKIE] as string | undefined;
  const session = await readAuthFromCookie(authToken);
  const clientId = session?.type === "client" ? session.userId : null;

  const reference = makeOrderReference();
  const order = await prisma.order.create({
    data: {
      reference,
      clientId,
      email,
      customerName,
      phone: String(customer.phone ?? "").trim() || null,
      shippingAddress: shippingAddress || null,
      status: "paid",
      subtotal,
      discount,
      shipping,
      total,
      currency: "RWF",
      couponCode,
      couponId,
      paymentMethod,
      notes:
        [
          String(customer.notes ?? "").trim() || null,
          `Paid via ${paymentMethodLabel(paymentMethod)}`,
          couponCode ? `Coupon ${couponCode}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
          .slice(0, 500) || null,
      paidAt: new Date(),
      items: {
        create: lines.map((line) => ({
          productId: line.productId || null,
          kind: line.kind === "ticket" ? "ticket" : "product",
          name: String(line.name).slice(0, 200),
          slug: String(line.slug || line.productId || "item").slice(0, 160),
          size: String(line.size || "OS").slice(0, 20),
          color: String(line.color || "-").slice(0, 80),
          quantity: Math.max(1, line.quantity),
          unitAmount: Math.max(0, line.price),
          imageSrc: line.image?.src?.slice(0, 255) ?? null,
          brandId: line.brandId ?? null,
          brandName: line.brandName ?? null,
        })),
      },
    },
    include: { items: true },
  });

  if (couponId) {
    await redeemCoupon(couponId);
  }

  await consumeInventory(
    order.items.map((item) => ({
      productId: item.productId,
      kind: item.kind,
      quantity: item.quantity,
    })),
  );

  void import("../lib/mail.js")
    .then(({ sendOrderReceiptEmail }) =>
      sendOrderReceiptEmail({
        to: order.email,
        customerName: order.customerName,
        reference: order.reference,
        lines: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitAmount: item.unitAmount,
          meta: `${item.color} / ${item.size}`,
        })),
        shipping: order.shipping,
        discount: order.discount,
        couponCode: order.couponCode,
        total: order.total,
        shippingAddress: order.shippingAddress ?? undefined,
        paymentMethod: order.paymentMethod,
        paidAt: order.paidAt,
      }),
    )
    .catch((err) => console.error("[demo-complete] receipt mail", err));

  void notifyBrandsOfSale(order).catch((err) =>
    console.error("[demo-complete] brand sale mail", err),
  );

  res.status(201).json({ order: mapOrder(order) });
});

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}***@${domain}`;
}
