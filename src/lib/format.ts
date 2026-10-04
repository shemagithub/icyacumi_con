import { formatMoneyIntl } from "@/lib/intl";
import { site } from "@/lib/site";

/** Currencies Stripe treats as whole units (no cents). */
const ZERO_DECIMAL = new Set(["RWF", "JPY", "KRW", "VND", "CLP"]);

/**
 * Format money for display · Intl currency code + locale grouping.
 * Amounts are stored as whole RWF francs (no minor units) by default.
 */
export function formatPrice(amount: number, currency: string = site.currency): string {
  return formatMoneyIntl(amount, currency, {
    zeroDecimal: ZERO_DECIMAL.has(currency.toUpperCase()),
  });
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
