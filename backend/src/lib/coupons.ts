import { prisma } from "./db.js";
import { shippingForSubtotal } from "./orders.js";

export const COUPON_TYPES = ["percent", "fixed", "free_shipping"] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export type CouponRecord = {
  id: string;
  code: string;
  type: string;
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  maxUses: number | null;
  usesCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CouponQuote = {
  ok: true;
  coupon: ReturnType<typeof mapCoupon>;
  subtotal: number;
  discount: number;
  shipping: number;
  shippingBefore: number;
  total: number;
  freeShipping: boolean;
};

export type CouponQuoteError = {
  ok: false;
  error: string;
};

export function normalizeCouponCode(raw: unknown) {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function mapCoupon(coupon: CouponRecord) {
  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type as CouponType,
    value: coupon.value,
    minSubtotal: coupon.minSubtotal,
    maxDiscount: coupon.maxDiscount,
    maxUses: coupon.maxUses,
    usesCount: coupon.usesCount,
    startsAt: coupon.startsAt?.toISOString() ?? null,
    endsAt: coupon.endsAt?.toISOString() ?? null,
    active: coupon.active,
    description: coupon.description,
    createdAt: coupon.createdAt.toISOString(),
    updatedAt: coupon.updatedAt.toISOString(),
  };
}

function isCouponType(value: string): value is CouponType {
  return (COUPON_TYPES as readonly string[]).includes(value);
}

export function validateCouponFields(input: {
  code?: unknown;
  type?: unknown;
  value?: unknown;
  minSubtotal?: unknown;
  maxDiscount?: unknown;
  maxUses?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  active?: unknown;
  description?: unknown;
}) {
  const code = normalizeCouponCode(input.code);
  if (!code || code.length < 3 || code.length > 40) {
    return { error: "Coupon code must be 3-40 characters." };
  }
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    return { error: "Use letters, numbers, hyphens, or underscores only." };
  }

  const type = String(input.type ?? "").toLowerCase().trim();
  if (!isCouponType(type)) {
    return { error: "Type must be percent, fixed, or free_shipping." };
  }

  let value = Math.round(Number(input.value ?? 0));
  if (!Number.isFinite(value) || value < 0) {
    return { error: "Value must be zero or a positive number." };
  }
  if (type === "percent") {
    if (value < 1 || value > 100) {
      return { error: "Percent coupons need a value from 1 to 100." };
    }
  } else if (type === "fixed") {
    if (value < 1) {
      return { error: "Fixed coupons need a value of at least 1 RWF." };
    }
  } else {
    value = 0;
  }

  const minSubtotal = Math.max(0, Math.round(Number(input.minSubtotal ?? 0)) || 0);
  let maxDiscount: number | null = null;
  if (input.maxDiscount !== undefined && input.maxDiscount !== null && input.maxDiscount !== "") {
    maxDiscount = Math.round(Number(input.maxDiscount));
    if (!Number.isFinite(maxDiscount) || maxDiscount < 1) {
      return { error: "Max discount must be a positive amount, or empty." };
    }
  }

  let maxUses: number | null = null;
  if (input.maxUses !== undefined && input.maxUses !== null && input.maxUses !== "") {
    maxUses = Math.round(Number(input.maxUses));
    if (!Number.isFinite(maxUses) || maxUses < 1) {
      return { error: "Max uses must be at least 1, or empty for unlimited." };
    }
  }

  let startsAt: Date | null = null;
  let endsAt: Date | null = null;
  if (input.startsAt) {
    startsAt = new Date(String(input.startsAt));
    if (Number.isNaN(startsAt.getTime())) {
      return { error: "Invalid start date." };
    }
  }
  if (input.endsAt) {
    endsAt = new Date(String(input.endsAt));
    if (Number.isNaN(endsAt.getTime())) {
      return { error: "Invalid end date." };
    }
  }
  if (startsAt && endsAt && endsAt.getTime() < startsAt.getTime()) {
    return { error: "End date must be after the start date." };
  }

  const description =
    typeof input.description === "string"
      ? input.description.trim().slice(0, 200) || null
      : null;

  const active =
    input.active === undefined ? true : Boolean(input.active);

  return {
    data: {
      code,
      type,
      value,
      minSubtotal,
      maxDiscount,
      maxUses,
      startsAt,
      endsAt,
      active,
      description,
    },
  };
}

function couponUnavailableReason(coupon: CouponRecord, now = new Date()) {
  if (!coupon.active) return "This coupon is inactive.";
  if (coupon.startsAt && coupon.startsAt.getTime() > now.getTime()) {
    return "This coupon is not active yet.";
  }
  if (coupon.endsAt && coupon.endsAt.getTime() < now.getTime()) {
    return "This coupon has expired.";
  }
  if (coupon.maxUses != null && coupon.usesCount >= coupon.maxUses) {
    return "This coupon has reached its usage limit.";
  }
  return null;
}

/** Quote a coupon against a merchandise subtotal (server-resolved). */
export async function quoteCoupon(opts: {
  code: string;
  subtotal: number;
}): Promise<CouponQuote | CouponQuoteError> {
  const code = normalizeCouponCode(opts.code);
  if (!code) {
    return { ok: false, error: "Enter a coupon code." };
  }

  const subtotal = Math.max(0, Math.round(opts.subtotal));
  const shippingBefore = shippingForSubtotal(subtotal);

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) {
    return { ok: false, error: "Coupon code not found." };
  }

  const unavailable = couponUnavailableReason(coupon);
  if (unavailable) return { ok: false, error: unavailable };

  if (subtotal < coupon.minSubtotal) {
    return {
      ok: false,
      error: `Add at least ${coupon.minSubtotal.toLocaleString("en-US")} RWF to use this coupon.`,
    };
  }

  let discount = 0;
  let shipping = shippingBefore;
  let freeShipping = false;

  if (coupon.type === "free_shipping") {
    freeShipping = true;
    shipping = 0;
    discount = 0;
  } else if (coupon.type === "percent") {
    discount = Math.floor((subtotal * coupon.value) / 100);
    if (coupon.maxDiscount != null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else if (coupon.type === "fixed") {
    discount = coupon.value;
  }

  discount = Math.min(discount, subtotal);
  const total = Math.max(0, subtotal - discount + shipping);

  return {
    ok: true,
    coupon: mapCoupon(coupon),
    subtotal,
    discount,
    shipping,
    shippingBefore,
    total,
    freeShipping,
  };
}

export async function redeemCoupon(couponId: string) {
  await prisma.coupon.update({
    where: { id: couponId },
    data: { usesCount: { increment: 1 } },
  });
}
