import { prisma } from "./db.js";

type InventoryLine = {
  productId: string | null;
  kind: string;
  quantity: number;
};

/**
 * Decrement product stock (and event tickets) after a paid order.
 * Sets product.inStock=false when stock hits 0.
 */
export async function consumeInventory(items: InventoryLine[]) {
  const productQty = new Map<string, number>();
  const ticketQty = new Map<string, number>();

  for (const item of items) {
    if (!item.productId) continue;
    const qty = Math.max(0, Math.round(Number(item.quantity) || 0));
    if (qty <= 0) continue;
    if (item.kind === "ticket") {
      ticketQty.set(item.productId, (ticketQty.get(item.productId) ?? 0) + qty);
    } else {
      productQty.set(item.productId, (productQty.get(item.productId) ?? 0) + qty);
    }
  }

  if (!productQty.size && !ticketQty.size) return;

  await prisma.$transaction(async (tx) => {
    for (const [id, qty] of productQty) {
      const product = await tx.product.findUnique({ where: { id } });
      if (!product) continue;
      const next = Math.max(0, product.stockQuantity - qty);
      await tx.product.update({
        where: { id },
        data: {
          stockQuantity: next,
          inStock: next > 0,
        },
      });
    }

    for (const [id, qty] of ticketQty) {
      const event = await tx.event.findUnique({ where: { id } });
      if (!event) continue;
      const next = Math.max(0, event.ticketsLeft - qty);
      await tx.event.update({
        where: { id },
        data: { ticketsLeft: next },
      });
    }
  });
}

export function parseStockQuantity(value: unknown, fallback = 0): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100_000, n));
}
