import { prisma } from "./db.js";
import {
  sendBrandSaleEmail,
  sendBrandStockAlertEmail,
  sendOrderStatusEmail,
} from "./mail.js";

type SaleItem = {
  brandId: string | null;
  brandName: string | null;
  productId: string | null;
  name: string;
  quantity: number;
  unitAmount: number;
  size: string;
  color: string;
  kind: string;
};

type SaleOrder = {
  reference: string;
  customerName: string;
  email?: string | null;
  paymentMethod?: string | null;
  shippingAddress?: string | null;
  items: SaleItem[];
};

async function resolveBrandId(item: SaleItem): Promise<{
  brandId: string | null;
  brandName: string | null;
}> {
  if (item.brandId) {
    return { brandId: item.brandId, brandName: item.brandName };
  }
  if (!item.productId) {
    return { brandId: null, brandName: item.brandName };
  }

  if (item.kind === "ticket") {
    const event = await prisma.event.findUnique({
      where: { id: item.productId },
      select: { brandId: true, brand: { select: { name: true } } },
    });
    if (!event) return { brandId: null, brandName: item.brandName };
    return {
      brandId: event.brandId,
      brandName: item.brandName || event.brand.name,
    };
  }

  const product = await prisma.product.findUnique({
    where: { id: item.productId },
    select: { brandId: true, brand: { select: { name: true } } },
  });
  if (!product) return { brandId: null, brandName: item.brandName };
  return {
    brandId: product.brandId,
    brandName: item.brandName || product.brand.name,
  };
}

async function brandOwnerEmails(brandId: string) {
  const users = await prisma.brandUser.findMany({
    where: { brandId },
    select: { email: true },
  });
  return users.map((user) => user.email).filter(Boolean);
}

/**
 * Email every brand that has lines on a paid order (products + tickets).
 * Resolves missing brandId from product/event when needed.
 */
export async function notifyBrandsOfSale(order: SaleOrder) {
  const byBrand = new Map<
    string,
    {
      brandName: string;
      lines: Array<{
        name: string;
        quantity: number;
        unitAmount: number;
        meta?: string;
      }>;
      productIds: string[];
    }
  >();

  for (const item of order.items) {
    const resolved = await resolveBrandId(item);
    if (!resolved.brandId) continue;

    const entry = byBrand.get(resolved.brandId) ?? {
      brandName: resolved.brandName ?? "Brand",
      lines: [],
      productIds: [],
    };
    entry.lines.push({
      name: item.name,
      quantity: item.quantity,
      unitAmount: item.unitAmount,
      meta: `${item.kind === "ticket" ? "Ticket" : item.color || "-"} / ${item.size || "OS"}`,
    });
    if (item.kind !== "ticket" && item.productId) {
      entry.productIds.push(item.productId);
    }
    byBrand.set(resolved.brandId, entry);
  }

  if (!byBrand.size) {
    console.warn("[brand-notify] No brand owners to email for", order.reference);
    return;
  }

  for (const [brandId, payload] of byBrand) {
    const emails = await brandOwnerEmails(brandId);
    if (!emails.length) {
      console.warn("[brand-notify] Brand has no user emails:", brandId);
      continue;
    }

    const total = payload.lines.reduce(
      (sum, line) => sum + line.unitAmount * line.quantity,
      0,
    );

    const result = await sendBrandSaleEmail({
      to: emails,
      brandName: payload.brandName,
      customerName: order.customerName,
      customerEmail: order.email ?? undefined,
      reference: order.reference,
      paymentMethod: order.paymentMethod ?? undefined,
      shippingAddress: order.shippingAddress ?? undefined,
      lines: payload.lines,
      total,
    });

    if (!result.ok) {
      console.warn(
        "[brand-notify] Sale email failed/skipped for",
        payload.brandName,
        result.error || result.skipped,
      );
    }

    // Sold-out alerts for products that hit zero after this order
    if (payload.productIds.length) {
      const uniqueIds = [...new Set(payload.productIds)];
      const products = await prisma.product.findMany({
        where: { id: { in: uniqueIds }, brandId },
        select: { id: true, name: true, stockQuantity: true, inStock: true },
      });
      for (const product of products) {
        if (product.stockQuantity > 0 && product.inStock) continue;
        await sendBrandStockAlertEmail({
          to: emails,
          brandName: payload.brandName,
          productName: product.name,
          stockQuantity: product.stockQuantity,
          reference: order.reference,
        }).catch((err) =>
          console.error("[brand-notify] stock alert mail", err),
        );
      }
    }
  }
}

/** Email brands when admin updates an order that includes their items. */
export async function notifyBrandsOfOrderStatus(order: {
  reference: string;
  customerName: string;
  status: string;
  statusLabel: string;
  trackingCode?: string | null;
  carrier?: string | null;
  items: Array<{
    brandId: string | null;
    productId: string | null;
    kind: string;
    brandName: string | null;
  }>;
}) {
  const brandIds = new Set<string>();
  const brandNames = new Map<string, string>();

  for (const item of order.items) {
    const resolved = await resolveBrandId({
      brandId: item.brandId,
      brandName: item.brandName,
      productId: item.productId,
      name: "",
      quantity: 1,
      unitAmount: 0,
      size: "OS",
      color: "-",
      kind: item.kind,
    });
    if (!resolved.brandId) continue;
    brandIds.add(resolved.brandId);
    if (resolved.brandName) brandNames.set(resolved.brandId, resolved.brandName);
  }

  for (const brandId of brandIds) {
    const emails = await brandOwnerEmails(brandId);
    if (!emails.length) continue;
    await sendOrderStatusEmail({
      to: emails,
      customerName: order.customerName,
      reference: order.reference,
      status: order.status,
      statusLabel: order.statusLabel,
      trackingCode: order.trackingCode,
      carrier: order.carrier,
      audience: "brand",
      brandName: brandNames.get(brandId),
    });
  }
}
