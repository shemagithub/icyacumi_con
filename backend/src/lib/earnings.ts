import { prisma } from "./db.js";

export const DEFAULT_SETTINGS_ID = "default";

export type CommissionSettings = {
  productCommissionPercent: number;
  ticketCommissionPercent: number;
};

export async function getPlatformSettings(): Promise<CommissionSettings> {
  const row = await prisma.platformSettings.upsert({
    where: { id: DEFAULT_SETTINGS_ID },
    update: {},
    create: {
      id: DEFAULT_SETTINGS_ID,
      productCommissionPercent: 10,
      ticketCommissionPercent: 5,
    },
  });
  return {
    productCommissionPercent: row.productCommissionPercent,
    ticketCommissionPercent: row.ticketCommissionPercent,
  };
}

export function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

type ProductLike = { price: number; views: number };
type EventLike = { price: number; capacity: number; ticketsLeft: number };
type PayoutLike = { amount: number; feeAmount?: number | null; status: string };

/** Flat RWF fee charged from brand earnings on every withdrawal request. */
export const BRAND_WITHDRAWAL_FEE_RWF = 350;

/** Minimum net amount a brand can request to receive. */
export const BRAND_WITHDRAWAL_MIN_NET_RWF = 100;

/** Total deducted from available balance for a payout row. */
export function payoutBalanceDebit(payout: {
  amount: number;
  feeAmount?: number | null;
}) {
  return Math.max(0, Math.round(payout.amount)) + Math.max(0, Math.round(payout.feeAmount ?? 0));
}

/** Platform commission report from real paid order lines, per brand. */
export async function getPlatformCommissionReport() {
  const settings = await getPlatformSettings();
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const items = await prisma.orderItem.findMany({
    where: {
      order: { status: { not: "cancelled" } },
    },
    select: {
      brandId: true,
      brandName: true,
      kind: true,
      quantity: true,
      unitAmount: true,
      productId: true,
      order: { select: { id: true, reference: true } },
    },
  });

  // Resolve missing brandId from product / event when possible.
  const productIds = [
    ...new Set(
      items
        .filter((item) => !item.brandId && item.kind !== "ticket" && item.productId)
        .map((item) => item.productId as string),
    ),
  ];
  const eventIds = [
    ...new Set(
      items
        .filter((item) => !item.brandId && item.kind === "ticket" && item.productId)
        .map((item) => item.productId as string),
    ),
  ];
  const [products, events] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, brandId: true, brand: { select: { name: true } } },
        })
      : Promise.resolve([]),
    eventIds.length
      ? prisma.event.findMany({
          where: { id: { in: eventIds } },
          select: { id: true, brandId: true, brand: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);
  const productBrand = new Map(
    products.map((row) => [row.id, { id: row.brandId, name: row.brand.name }]),
  );
  const eventBrand = new Map(
    events.map((row) => [row.id, { id: row.brandId, name: row.brand.name }]),
  );

  type Acc = {
    brandId: string;
    brandName: string;
    brandSlug: string;
    productSales: number;
    ticketSales: number;
    productUnits: number;
    ticketUnits: number;
    orderIds: Set<string>;
  };

  const byBrand = new Map<string, Acc>();
  for (const brand of brands) {
    byBrand.set(brand.id, {
      brandId: brand.id,
      brandName: brand.name,
      brandSlug: brand.slug,
      productSales: 0,
      ticketSales: 0,
      productUnits: 0,
      ticketUnits: 0,
      orderIds: new Set(),
    });
  }

  for (const item of items) {
    let brandId = item.brandId;
    let brandName = item.brandName;
    if (!brandId && item.productId) {
      const resolved =
        item.kind === "ticket"
          ? eventBrand.get(item.productId)
          : productBrand.get(item.productId);
      if (resolved) {
        brandId = resolved.id;
        brandName = brandName || resolved.name;
      }
    }
    if (!brandId) continue;

    let acc = byBrand.get(brandId);
    if (!acc) {
      acc = {
        brandId,
        brandName: brandName || "Brand",
        brandSlug: "",
        productSales: 0,
        ticketSales: 0,
        productUnits: 0,
        ticketUnits: 0,
        orderIds: new Set(),
      };
      byBrand.set(brandId, acc);
    }

    const lineGross = Math.max(0, item.unitAmount) * Math.max(1, item.quantity);
    acc.orderIds.add(item.order.id);
    if (item.kind === "ticket") {
      acc.ticketSales += lineGross;
      acc.ticketUnits += item.quantity;
    } else {
      acc.productSales += lineGross;
      acc.productUnits += item.quantity;
    }
  }

  const productRate = clampPercent(settings.productCommissionPercent);
  const ticketRate = clampPercent(settings.ticketCommissionPercent);

  const brandRows = [...byBrand.values()]
    .map((acc) => {
      const productCommission = Math.round((acc.productSales * productRate) / 100);
      const ticketCommission = Math.round((acc.ticketSales * ticketRate) / 100);
      const salesGross = acc.productSales + acc.ticketSales;
      const platformCommission = productCommission + ticketCommission;
      return {
        brandId: acc.brandId,
        brandName: acc.brandName,
        brandSlug: acc.brandSlug,
        orderCount: acc.orderIds.size,
        productUnits: acc.productUnits,
        ticketUnits: acc.ticketUnits,
        productSales: acc.productSales,
        ticketSales: acc.ticketSales,
        salesGross,
        productCommission,
        ticketCommission,
        platformCommission,
        brandKeeps: Math.max(0, salesGross - platformCommission),
      };
    })
    .filter((row) => row.salesGross > 0 || brands.some((b) => b.id === row.brandId))
    .sort((a, b) => b.salesGross - a.salesGross || a.brandName.localeCompare(b.brandName));

  const sellingBrands = brandRows.filter((row) => row.salesGross > 0);
  const totals = sellingBrands.reduce(
    (sum, row) => ({
      salesGross: sum.salesGross + row.salesGross,
      productSales: sum.productSales + row.productSales,
      ticketSales: sum.ticketSales + row.ticketSales,
      platformCommission: sum.platformCommission + row.platformCommission,
      productCommission: sum.productCommission + row.productCommission,
      ticketCommission: sum.ticketCommission + row.ticketCommission,
      brandKeeps: sum.brandKeeps + row.brandKeeps,
      orderCount: sum.orderCount + row.orderCount,
    }),
    {
      salesGross: 0,
      productSales: 0,
      ticketSales: 0,
      platformCommission: 0,
      productCommission: 0,
      ticketCommission: 0,
      brandKeeps: 0,
      orderCount: 0,
    },
  );

  return {
    settings,
    brands: brandRows,
    sellingBrands,
    totals,
  };
}

/**
 * Admin view: every brand wallet (earned / available / pending) + marketplace circulation.
 * Available = brand keeps from paid sales − (payout net + withdrawal fees) pending/paid.
 */
export async function getAdminBrandsMoneyOverview() {
  const [report, payouts, brands] = await Promise.all([
    getPlatformCommissionReport(),
    prisma.payout.findMany({
      select: {
        brandId: true,
        amount: true,
        feeAmount: true,
        status: true,
      },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        payoutProvider: true,
        payoutAccount: true,
      },
    }),
  ]);

  const salesByBrand = new Map(
    report.brands.map((row) => [row.brandId, row]),
  );

  type PayoutAcc = {
    paidOut: number;
    pending: number;
    feesPaid: number;
    feesPending: number;
  };
  const payoutByBrand = new Map<string, PayoutAcc>();
  for (const payout of payouts) {
    const acc = payoutByBrand.get(payout.brandId) ?? {
      paidOut: 0,
      pending: 0,
      feesPaid: 0,
      feesPending: 0,
    };
    const fee = Math.max(0, Math.round(payout.feeAmount ?? 0));
    const net = Math.max(0, Math.round(payout.amount));
    if (payout.status === "paid") {
      acc.paidOut += net;
      acc.feesPaid += fee;
    } else if (payout.status === "pending") {
      acc.pending += net;
      acc.feesPending += fee;
    }
    payoutByBrand.set(payout.brandId, acc);
  }

  const rows = brands.map((brand) => {
    const sales = salesByBrand.get(brand.id);
    const payout = payoutByBrand.get(brand.id) ?? {
      paidOut: 0,
      pending: 0,
      feesPaid: 0,
      feesPending: 0,
    };
    const totalEarned = sales?.brandKeeps ?? 0;
    const platformCommission = sales?.platformCommission ?? 0;
    const salesGross = sales?.salesGross ?? 0;
    const feesCollected = payout.feesPaid + payout.feesPending;
    const walletDebited = payout.paidOut + payout.pending + feesCollected;
    const available = Math.max(0, totalEarned - walletDebited);
    return {
      brandId: brand.id,
      brandName: brand.name,
      brandSlug: brand.slug,
      status: brand.status,
      payoutProvider: brand.payoutProvider,
      payoutAccount: brand.payoutAccount,
      orderCount: sales?.orderCount ?? 0,
      salesGross,
      platformCommission,
      productCommission: sales?.productCommission ?? 0,
      ticketCommission: sales?.ticketCommission ?? 0,
      totalEarned,
      /** Net sent / waiting to brand (excludes withdrawal fee). */
      paidOut: payout.paidOut,
      pending: payout.pending,
      feesPaid: payout.feesPaid,
      feesPending: payout.feesPending,
      feesCollected,
      available,
    };
  });

  rows.sort(
    (a, b) =>
      b.available - a.available ||
      b.totalEarned - a.totalEarned ||
      a.brandName.localeCompare(b.brandName),
  );

  const withBalance = rows.filter((row) => row.available > 0 || row.pending > 0);
  const earning = rows.filter((row) => row.totalEarned > 0);

  const totals = rows.reduce(
    (sum, row) => ({
      salesGross: sum.salesGross + row.salesGross,
      platformCommission: sum.platformCommission + row.platformCommission,
      brandEarned: sum.brandEarned + row.totalEarned,
      brandAvailable: sum.brandAvailable + row.available,
      brandPending: sum.brandPending + row.pending,
      brandPaidOut: sum.brandPaidOut + row.paidOut,
      withdrawalFees: sum.withdrawalFees + row.feesCollected,
      feesPending: sum.feesPending + row.feesPending,
      orderCount: sum.orderCount + row.orderCount,
    }),
    {
      salesGross: 0,
      platformCommission: 0,
      brandEarned: 0,
      brandAvailable: 0,
      brandPending: 0,
      brandPaidOut: 0,
      withdrawalFees: 0,
      feesPending: 0,
      orderCount: 0,
    },
  );

  return {
    settings: report.settings,
    brands: rows,
    brandsWithBalance: withBalance,
    earningBrands: earning,
    totals: {
      ...totals,
      /** Money still sitting in brand wallets (available to withdraw). */
      circulatingInBrandAccounts: totals.brandAvailable,
      /** Available + pending payouts (net + fee) still owed to brands. */
      circulatingWithPending:
        totals.brandAvailable + totals.brandPending + totals.feesPending,
      brandCount: brands.length,
      brandsWithBalanceCount: withBalance.length,
      earningBrandCount: earning.length,
    },
  };
}

/**
 * Platform commission balance: earned from sales minus paid/pending withdrawals.
 */
export async function getPlatformPayoutSummary() {
  const [report, payouts] = await Promise.all([
    getPlatformCommissionReport(),
    prisma.platformPayout.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const earned = report.totals.platformCommission;
  const paidOut = payouts
    .filter((row) => row.status === "paid")
    .reduce((sum, row) => sum + row.amount, 0);
  const pending = payouts
    .filter((row) => row.status === "pending")
    .reduce((sum, row) => sum + row.amount, 0);
  const available = Math.max(0, earned - paidOut - pending);

  return {
    earned,
    paidOut,
    pending,
    available,
    productCommission: report.totals.productCommission,
    ticketCommission: report.totals.ticketCommission,
    salesGross: report.totals.salesGross,
    productCommissionPercent: report.settings.productCommissionPercent,
    ticketCommissionPercent: report.settings.ticketCommissionPercent,
    payouts: payouts.map((row) => ({
      id: row.id,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      method: row.method,
      destination: row.destination,
      note: row.note,
      createdById: row.createdById,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  };
}

const brandSaleItemSelect = {
  id: true,
  kind: true,
  name: true,
  slug: true,
  size: true,
  color: true,
  quantity: true,
  unitAmount: true,
  imageSrc: true,
  brandId: true,
  productId: true,
  order: {
    select: {
      id: true,
      reference: true,
      status: true,
      customerName: true,
      paymentMethod: true,
      trackingCode: true,
      carrier: true,
      paidAt: true,
      createdAt: true,
      shippedAt: true,
      deliveredAt: true,
    },
  },
} as const;

/** Paid order lines sold by a brand · for portal sales / transactions. */
export async function listBrandSales(brandId: string) {
  const settings = await getPlatformSettings();

  const [productIds, eventIds] = await Promise.all([
    prisma.product
      .findMany({ where: { brandId }, select: { id: true } })
      .then((rows) => rows.map((row) => row.id)),
    prisma.event
      .findMany({ where: { brandId }, select: { id: true } })
      .then((rows) => rows.map((row) => row.id)),
  ]);

  const [direct, orphanProducts, orphanTickets] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        brandId,
        order: { status: { not: "cancelled" } },
      },
      orderBy: { order: { paidAt: "desc" } },
      select: brandSaleItemSelect,
    }),
    productIds.length
      ? prisma.orderItem.findMany({
          where: {
            brandId: null,
            kind: { not: "ticket" },
            productId: { in: productIds },
            order: { status: { not: "cancelled" } },
          },
          orderBy: { order: { paidAt: "desc" } },
          select: brandSaleItemSelect,
        })
      : Promise.resolve([]),
    eventIds.length
      ? prisma.orderItem.findMany({
          where: {
            brandId: null,
            kind: "ticket",
            productId: { in: eventIds },
            order: { status: { not: "cancelled" } },
          },
          orderBy: { order: { paidAt: "desc" } },
          select: brandSaleItemSelect,
        })
      : Promise.resolve([]),
  ]);

  const byId = new Map<string, (typeof direct)[number]>();
  for (const item of [...direct, ...orphanProducts, ...orphanTickets]) {
    byId.set(item.id, item);
  }

  const lines = [...byId.values()]
    .map((item) => {
      const lineTotal = Math.max(0, item.unitAmount) * Math.max(1, item.quantity);
      const isTicket = item.kind === "ticket";
      const commissionPercent = isTicket
        ? settings.ticketCommissionPercent
        : settings.productCommissionPercent;
      const platformCut = Math.round(
        (lineTotal * clampPercent(commissionPercent)) / 100,
      );
      const date = item.order.paidAt ?? item.order.createdAt;
      return {
        id: item.id,
        date: date.toISOString(),
        reference: item.order.reference,
        orderId: item.order.id,
        orderStatus: item.order.status,
        customerName: item.order.customerName,
        paymentMethod: item.order.paymentMethod,
        trackingCode: item.order.trackingCode,
        carrier: item.order.carrier,
        shippedAt: item.order.shippedAt?.toISOString() ?? null,
        deliveredAt: item.order.deliveredAt?.toISOString() ?? null,
        kind: isTicket ? ("ticket" as const) : ("product" as const),
        name: item.name,
        slug: item.slug,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitAmount: item.unitAmount,
        lineTotal,
        platformCut,
        brandKeeps: Math.max(0, lineTotal - platformCut),
        imageSrc: item.imageSrc,
      };
    })
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  const totals = lines.reduce(
    (sum, line) => {
      if (line.kind === "ticket") {
        sum.ticketSales += line.lineTotal;
        sum.ticketUnits += line.quantity;
      } else {
        sum.productSales += line.lineTotal;
        sum.productUnits += line.quantity;
      }
      sum.salesGross += line.lineTotal;
      sum.platformCut += line.platformCut;
      sum.brandKeeps += line.brandKeeps;
      sum.orderIds.add(line.orderId);
      return sum;
    },
    {
      salesGross: 0,
      productSales: 0,
      ticketSales: 0,
      productUnits: 0,
      ticketUnits: 0,
      platformCut: 0,
      brandKeeps: 0,
      orderIds: new Set<string>(),
    },
  );

  return {
    settings,
    lines,
    totals: {
      salesGross: totals.salesGross,
      productSales: totals.productSales,
      ticketSales: totals.ticketSales,
      productUnits: totals.productUnits,
      ticketUnits: totals.ticketUnits,
      platformCut: totals.platformCut,
      brandKeeps: totals.brandKeeps,
      orderCount: totals.orderIds.size,
      lineCount: lines.length,
    },
  };
}

/**
 * Withdrawable balance from real paid order lines (same source as Sales / admin commission).
 */
export async function getBrandPayoutSummary(brandId: string) {
  const [sales, payouts, products] = await Promise.all([
    listBrandSales(brandId),
    prisma.payout.findMany({ where: { brandId } }),
    prisma.product.findMany({
      where: { brandId },
      select: { price: true },
    }),
  ]);

  const settings = sales.settings;
  const productKeeps = sales.lines
    .filter((line) => line.kind === "product")
    .reduce((sum, line) => sum + line.brandKeeps, 0);
  const ticketKeeps = sales.lines
    .filter((line) => line.kind === "ticket")
    .reduce((sum, line) => sum + line.brandKeeps, 0);
  const productCommission = sales.lines
    .filter((line) => line.kind === "product")
    .reduce((sum, line) => sum + line.platformCut, 0);
  const ticketCommission = sales.lines
    .filter((line) => line.kind === "ticket")
    .reduce((sum, line) => sum + line.platformCut, 0);

  const paidOut = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + payoutBalanceDebit(p), 0);
  const pending = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + payoutBalanceDebit(p), 0);
  const feesPaid = payouts
    .filter((p) => p.status === "paid" || p.status === "pending")
    .reduce((sum, p) => sum + Math.max(0, p.feeAmount ?? 0), 0);
  const totalEarned = sales.totals.brandKeeps;
  const available = Math.max(0, totalEarned - paidOut - pending);
  const maxReceivable = Math.max(
    0,
    available >= BRAND_WITHDRAWAL_FEE_RWF + BRAND_WITHDRAWAL_MIN_NET_RWF
      ? available - BRAND_WITHDRAWAL_FEE_RWF
      : 0,
  );
  const catalogValue = products.reduce((sum, p) => sum + p.price, 0);

  return {
    catalogValue,
    shopGross: sales.totals.productSales,
    ticketGross: sales.totals.ticketSales,
    shopEarnings: productKeeps,
    ticketEarnings: ticketKeeps,
    productCommission,
    ticketCommission,
    platformCommission: sales.totals.platformCut,
    productCommissionPercent: settings.productCommissionPercent,
    ticketCommissionPercent: settings.ticketCommissionPercent,
    totalEarned,
    paidOut,
    pending,
    feesPaid,
    withdrawalFee: BRAND_WITHDRAWAL_FEE_RWF,
    minWithdrawal: BRAND_WITHDRAWAL_MIN_NET_RWF,
    maxReceivable,
    available,
    availableEstimate: available,
    salesGross: sales.totals.salesGross,
    orderCount: sales.totals.orderCount,
    lineCount: sales.totals.lineCount,
    recentLines: sales.lines.slice(0, 8),
  };
}

/** @deprecated Prefer getBrandPayoutSummary · kept for any legacy callers. */
export function computeBrandEarnings(input: {
  products: ProductLike[];
  events: EventLike[];
  payouts: PayoutLike[];
  productCommissionPercent: number;
  ticketCommissionPercent: number;
}) {
  const {
    products,
    events,
    payouts,
    productCommissionPercent,
    ticketCommissionPercent,
  } = input;

  const catalogValue = products.reduce((sum, p) => sum + p.price, 0);
  const shopGross = products.reduce((sum, p) => {
    const estimatedSales = Math.min(Math.floor(p.views / 15), 8);
    return sum + estimatedSales * p.price;
  }, 0);
  const ticketGross = events.reduce(
    (sum, e) => sum + e.price * Math.max(0, e.capacity - e.ticketsLeft),
    0,
  );

  const productCommission = Math.round(
    (shopGross * clampPercent(productCommissionPercent)) / 100,
  );
  const ticketCommission = Math.round(
    (ticketGross * clampPercent(ticketCommissionPercent)) / 100,
  );
  const shopEarnings = Math.max(0, shopGross - productCommission);
  const ticketEarnings = Math.max(0, ticketGross - ticketCommission);
  const totalEarned = shopEarnings + ticketEarnings;
  const platformCommission = productCommission + ticketCommission;

  const paidOut = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + payoutBalanceDebit(p), 0);
  const pending = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + payoutBalanceDebit(p), 0);
  const available = Math.max(0, totalEarned - paidOut - pending);

  return {
    catalogValue,
    shopGross,
    ticketGross,
    shopEarnings,
    ticketEarnings,
    productCommission,
    ticketCommission,
    platformCommission,
    productCommissionPercent: clampPercent(productCommissionPercent),
    ticketCommissionPercent: clampPercent(ticketCommissionPercent),
    totalEarned,
    paidOut,
    pending,
    available,
    availableEstimate: available,
    ticketValue: ticketEarnings,
  };
}
