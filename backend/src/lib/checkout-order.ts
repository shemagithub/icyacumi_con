import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "./db.js";
import { quoteCoupon, redeemCoupon } from "./coupons.js";
import { consumeInventory } from "./inventory.js";
import { notifyBrandsOfSale } from "./brand-notifications.js";
import {
  makeOrderReference,
  mapOrder,
  shippingForSubtotal,
  type SharedCartLine,
} from "./orders.js";

export type PaymentMethodId = "card" | "mtn" | "airtel";

export type CheckoutCustomer = {
  email: string;
  name: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
};

export type SharedCheckout = {
  id: string;
  token: string;
  ownerClientId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  message: string | null;
};

export type PreparedCheckout = {
  lines: SharedCartLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponId: string | null;
  couponCode: string | null;
  shared: SharedCheckout | null;
  customer: CheckoutCustomer;
  paymentMethod: PaymentMethodId;
};

export function normalizePaymentMethod(raw: unknown): PaymentMethodId {
  const value = String(raw ?? "")
    .toLowerCase()
    .trim();
  if (value === "mtn" || value === "momo" || value === "mtn_momo") return "mtn";
  if (value === "airtel" || value === "airtel_money") return "airtel";
  return "card";
}

export function paymentMethodLabel(method: PaymentMethodId) {
  if (method === "mtn") return "MTN MoMo";
  if (method === "airtel") return "Airtel Money";
  return "Card";
}

export function parseCheckoutCustomer(raw: unknown): CheckoutCustomer | string {
  const customer = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const email = String(customer.email ?? "")
    .toLowerCase()
    .trim();
  const name = String(customer.name ?? "").trim();
  if (!email.includes("@") || !name) {
    return "Name and email are required.";
  }
  return {
    email,
    name,
    phone: String(customer.phone ?? "").trim() || undefined,
    line1: String(customer.line1 ?? "").trim() || undefined,
    line2: String(customer.line2 ?? "").trim() || undefined,
    city: String(customer.city ?? "").trim() || undefined,
    state: String(customer.state ?? "").trim() || undefined,
    postalCode: String(customer.postalCode ?? "").trim() || undefined,
    country: String(customer.country ?? "").trim() || undefined,
    notes: String(customer.notes ?? "").trim() || undefined,
  };
}

export function shippingAddressFromCustomer(customer: CheckoutCustomer) {
  return [
    customer.line1,
    customer.line2,
    customer.city,
    customer.state,
    customer.postalCode,
    customer.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export async function resolvePricedLines(
  rawLines: Array<Record<string, unknown>>,
  options?: { ignoreStock?: boolean },
): Promise<{ lines: SharedCartLine[] } | { error: string }> {
  const ignoreStock = Boolean(options?.ignoreStock);
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
      if (!ignoreStock && left <= 0) {
        return { error: `${event.title} is sold out.` };
      }
      if (!ignoreStock && quantity > left) {
        return { error: `Only ${left} tickets left for ${event.title}.` };
      }
      remainingTickets.set(event.id, Math.max(0, left - quantity));

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
    if (!ignoreStock && left <= 0) {
      return { error: `${product.name} is sold out.` };
    }
    if (!ignoreStock && quantity > left) {
      return {
        error: `Only ${left} left in stock for ${product.name}.`,
      };
    }
    remainingProduct.set(product.id, Math.max(0, left - quantity));

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

export async function prepareCheckout(input: {
  rawItems?: Array<Record<string, unknown>>;
  sharedCartToken?: string;
  couponCode?: string;
  customer: CheckoutCustomer;
  paymentMethod: PaymentMethodId;
  ignoreStock?: boolean;
}): Promise<PreparedCheckout | { error: string; status: number }> {
  let shared: SharedCheckout | null = null;
  let lines: SharedCartLine[];

  const token = String(input.sharedCartToken ?? "").trim();
  if (token) {
    const row = await prisma.sharedCart.findUnique({ where: { token } });
    if (!row) return { error: "Shared bag not found.", status: 404 };
    if (row.status === "paid" && row.paidOrderId) {
      return { error: "This shared bag is already paid.", status: 409 };
    }
    if (row.status !== "open") {
      return { error: "This shared bag is no longer open for payment.", status: 409 };
    }
    if (row.expiresAt.getTime() < Date.now()) {
      await prisma.sharedCart.update({
        where: { id: row.id },
        data: { status: "expired" },
      });
      return { error: "This share link has expired.", status: 410 };
    }
    const storedLines = (Array.isArray(row.lines) ? row.lines : []) as SharedCartLine[];
    const priced = await resolvePricedLines(
      storedLines.map((line) => ({ ...line }) as unknown as Record<string, unknown>),
      { ignoreStock: input.ignoreStock },
    );
    if ("error" in priced) return { error: priced.error, status: 400 };
    lines = priced.lines;
    shared = {
      id: row.id,
      token: row.token,
      ownerClientId: row.ownerClientId,
      ownerName: row.ownerName,
      ownerEmail: row.ownerEmail,
      message: row.message,
    };
  } else {
    const priced = await resolvePricedLines(input.rawItems ?? [], {
      ignoreStock: input.ignoreStock,
    });
    if ("error" in priced) return { error: priced.error, status: 400 };
    lines = priced.lines;
  }

  const subtotal = lines.reduce(
    (sum, line) => sum + Math.max(0, line.price) * Math.max(1, line.quantity),
    0,
  );

  let discount = 0;
  let shipping = shippingForSubtotal(subtotal);
  let couponId: string | null = null;
  let couponCode: string | null = null;
  const couponRaw = String(input.couponCode ?? "").trim();
  if (couponRaw) {
    const quote = await quoteCoupon({ code: couponRaw, subtotal });
    if (!quote.ok) return { error: quote.error, status: 400 };
    discount = quote.discount;
    shipping = quote.shipping;
    couponId = quote.coupon.id;
    couponCode = quote.coupon.code;
  }
  const total = Math.max(0, subtotal - discount + shipping);

  return {
    lines,
    subtotal,
    discount,
    shipping,
    total,
    couponId,
    couponCode,
    shared,
    customer: input.customer,
    paymentMethod: input.paymentMethod,
  };
}

export async function createPaidOrder(input: {
  prepared: PreparedCheckout;
  clientId?: string | null;
  stripeSessionId?: string | null;
}) {
  const { prepared } = input;
  const { customer, paymentMethod, lines, shared } = prepared;

  if (input.stripeSessionId) {
    const existing = await prisma.order.findUnique({
      where: { stripeSessionId: input.stripeSessionId },
      include: { items: true },
    });
    if (existing) return existing;
  }

  const shippingAddress = shippingAddressFromCustomer(customer);
  const reference = makeOrderReference();

  const order = await prisma.order.create({
    data: {
      reference,
      clientId: shared?.ownerClientId ?? input.clientId ?? null,
      email: shared?.ownerEmail || customer.email,
      customerName: shared?.ownerName || customer.name,
      phone: customer.phone?.trim() || null,
      shippingAddress: shippingAddress || null,
      status: "paid",
      subtotal: prepared.subtotal,
      discount: prepared.discount,
      shipping: prepared.shipping,
      total: prepared.total,
      currency: "RWF",
      couponCode: prepared.couponCode,
      couponId: prepared.couponId,
      paymentMethod,
      stripeSessionId: input.stripeSessionId ?? null,
      sharedCartToken: shared?.token ?? null,
      notes:
        [
          shared?.message ? `Gift note: ${shared.message}` : null,
          customer.notes || null,
          shared ? `Paid by: ${customer.name} <${customer.email}>` : null,
          `Paid via ${paymentMethodLabel(paymentMethod)} · XentriPay`,
          prepared.couponCode ? `Coupon ${prepared.couponCode}` : null,
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

  if (shared) {
    await prisma.sharedCart.update({
      where: { id: shared.id },
      data: { status: "paid", paidOrderId: order.id },
    });
  }

  if (prepared.couponId) {
    await redeemCoupon(prepared.couponId);
  }

  await consumeInventory(
    order.items.map((item) => ({
      productId: item.productId,
      kind: item.kind,
      quantity: item.quantity,
    })),
  );

  void import("./mail.js")
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
    .catch((err) => console.error("[xentripay] receipt mail", err));

  void notifyBrandsOfSale(order).catch((err) =>
    console.error("[xentripay] brand sale mail", err),
  );

  return order;
}

export function mapPaidOrder(order: Prisma.OrderGetPayload<{ include: { items: true } }>) {
  return mapOrder(order);
}

export function isUniqueConstraint(error: unknown) {
  if (!error || typeof error !== "object") return false;
  return "code" in error && String((error as { code: unknown }).code) === "P2002";
}
