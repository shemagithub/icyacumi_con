import { site } from "@/lib/site";

/** Currencies Stripe treats as whole units (no cents). */
const ZERO_DECIMAL = new Set(["RWF", "JPY", "KRW", "VND", "CLP"]);

/**
 * Format money for display · always clear currency code + grouped amount.
 * Amounts are stored as whole RWF francs (no minor units).
 */
export function formatPrice(amount: number, currency: string = site.currency): string {
  const zeroDecimal = ZERO_DECIMAL.has(currency);
  const value = zeroDecimal ? Math.round(amount) : amount / 100;
  const number = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: zeroDecimal ? 0 : value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: zeroDecimal ? 0 : 2,
  }).format(value);
  return `${currency} ${number}`;
}

/** Amount to send to Stripe Checkout (zero-decimal currencies stay as-is). */
export function toStripeUnitAmount(
  amount: number,
  currency: string = site.currency,
): number {
  return ZERO_DECIMAL.has(currency) ? Math.round(amount) : Math.round(amount);
}

/** Percent off when compare-at is higher than the sale price. */
export function discountPercent(price: number, compareAtPrice?: number): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
