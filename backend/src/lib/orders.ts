import type { Prisma } from "../generated/prisma/client.js";

export const ORDER_STATUSES = [
  "paid",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  paid: "Order confirmed",
  processing: "Preparing your order",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

/** Build Prisma update payload for fulfillment status + shipping fields. */
export function buildOrderStatusUpdate(input: {
  status: OrderStatus;
  trackingCode?: unknown;
  carrier?: unknown;
  patchTracking?: boolean;
  patchCarrier?: boolean;
}) {
  const data: {
    status: OrderStatus;
    trackingCode?: string | null;
    carrier?: string | null;
    shippedAt?: Date | null;
    deliveredAt?: Date | null;
  } = { status: input.status };

  if (input.patchTracking) {
    data.trackingCode = String(input.trackingCode ?? "").trim() || null;
  }
  if (input.patchCarrier) {
    data.carrier = String(input.carrier ?? "").trim() || null;
  }
  if (input.status === "shipped" || input.status === "out_for_delivery") {
    data.shippedAt = new Date();
  }
  if (input.status === "delivered") {
    data.deliveredAt = new Date();
    data.shippedAt = data.shippedAt ?? new Date();
  }
  return data;
}

export async function notifyOrderStatusChange(order: {
  email: string;
  customerName: string;
  reference: string;
  status: string;
  trackingCode: string | null;
  carrier: string | null;
  items: Array<{
    brandId: string | null;
    brandName: string | null;
    productId: string | null;
    kind: string;
  }>;
}) {
  const statusLabel = STATUS_LABELS[order.status as OrderStatus] ?? order.status;
  const { sendOrderStatusEmail } = await import("./mail.js");
  const { notifyBrandsOfOrderStatus } = await import("./brand-notifications.js");

  await sendOrderStatusEmail({
    to: order.email,
    customerName: order.customerName,
    reference: order.reference,
    status: order.status,
    statusLabel,
    trackingCode: order.trackingCode,
    carrier: order.carrier,
    audience: "customer",
  });

  await notifyBrandsOfOrderStatus({
    reference: order.reference,
    customerName: order.customerName,
    status: order.status,
    statusLabel,
    trackingCode: order.trackingCode,
    carrier: order.carrier,
    items: order.items,
  });
}

export function makeToken(length = 10) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function makeOrderReference() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  return `BK-${stamp}-${makeToken(4).toUpperCase()}`;
}

export function mapOrder(order: {
  id: string;
  reference: string;
  clientId: string | null;
  email: string;
  customerName: string;
  phone: string | null;
  shippingAddress: string | null;
  status: string;
  trackingCode: string | null;
  carrier: string | null;
  subtotal: number;
  discount?: number;
  shipping: number;
  total: number;
  currency: string;
  couponCode?: string | null;
  couponId?: string | null;
  paymentMethod?: string | null;
  stripeSessionId: string | null;
  sharedCartToken: string | null;
  notes: string | null;
  paidAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items?: Array<{
    id: string;
    productId: string | null;
    kind: string;
    name: string;
    slug: string;
    size: string;
    color: string;
    quantity: number;
    unitAmount: number;
    imageSrc: string | null;
    brandId: string | null;
    brandName: string | null;
  }>;
}) {
  return {
    id: order.id,
    reference: order.reference,
    clientId: order.clientId,
    email: order.email,
    customerName: order.customerName,
    phone: order.phone,
    shippingAddress: order.shippingAddress,
    status: order.status,
    statusLabel: STATUS_LABELS[order.status as OrderStatus] ?? order.status,
    trackingCode: order.trackingCode,
    carrier: order.carrier,
    subtotal: order.subtotal,
    discount: order.discount ?? 0,
    shipping: order.shipping,
    total: order.total,
    currency: order.currency,
    couponCode: order.couponCode ?? null,
    couponId: order.couponId ?? null,
    paymentMethod: order.paymentMethod ?? null,
    stripeSessionId: order.stripeSessionId,
    sharedCartToken: order.sharedCartToken,
    notes: order.notes,
    paidAt: order.paidAt?.toISOString() ?? null,
    shippedAt: order.shippedAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    timeline: buildTimeline(order.status, {
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
    }),
    items: (order.items ?? []).map((item) => ({
      id: item.id,
      productId: item.productId,
      kind: item.kind,
      name: item.name,
      slug: item.slug,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitAmount: item.unitAmount,
      imageSrc: item.imageSrc,
      brandId: item.brandId,
      brandName: item.brandName,
    })),
  };
}

function buildTimeline(
  status: string,
  dates: {
    paidAt: Date | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    createdAt: Date;
  },
) {
  const rank: Record<string, number> = {
    paid: 1,
    processing: 2,
    shipped: 3,
    out_for_delivery: 4,
    delivered: 5,
    cancelled: 0,
  };
  const current = rank[status] ?? 1;
  const steps = [
    { key: "paid", label: STATUS_LABELS.paid, at: dates.paidAt ?? dates.createdAt },
    { key: "processing", label: STATUS_LABELS.processing, at: null },
    { key: "shipped", label: STATUS_LABELS.shipped, at: dates.shippedAt },
    {
      key: "out_for_delivery",
      label: STATUS_LABELS.out_for_delivery,
      at: null,
    },
    { key: "delivered", label: STATUS_LABELS.delivered, at: dates.deliveredAt },
  ] as const;

  return steps.map((step) => {
    const stepRank = rank[step.key] ?? 0;
    return {
      key: step.key,
      label: step.label,
      at: step.at ? step.at.toISOString() : null,
      state:
        status === "cancelled"
          ? "idle"
          : stepRank < current
            ? "done"
            : stepRank === current
              ? "current"
              : "upcoming",
    };
  });
}

export type SharedCartLine = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  kind?: string;
  brandId?: string | null;
  brandName?: string | null;
  image?: { src: string; alt: string };
};

export function asJsonLines(lines: SharedCartLine[]): Prisma.InputJsonValue {
  return lines as unknown as Prisma.InputJsonValue;
}

export const FREE_SHIP_THRESHOLD = 50_000;
export const SHIP_RATE = 2_500;

export function shippingForSubtotal(subtotal: number) {
  return subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIP_RATE;
}
