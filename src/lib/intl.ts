/**
 * International display helpers · locale-aware money, dates, and numbers.
 * Default marketplace locale is English with Africa/Kigali time (Rwanda hub).
 */

export const SITE_LOCALE = process.env.NEXT_PUBLIC_SITE_LOCALE ?? "en";
export const SITE_REGION = process.env.NEXT_PUBLIC_SITE_REGION ?? "RW";
export const SITE_TIMEZONE =
  process.env.NEXT_PUBLIC_SITE_TIMEZONE ?? "Africa/Kigali";
export const SITE_OG_LOCALE =
  process.env.NEXT_PUBLIC_OG_LOCALE ?? "en_US";

/** BCP 47 tag used for Intl formatters (e.g. en-RW). */
export function siteLocaleTag(
  locale: string = SITE_LOCALE,
  region: string = SITE_REGION,
): string {
  if (locale.includes("-")) return locale;
  return `${locale}-${region}`;
}

export function formatMoneyIntl(
  amount: number,
  currency: string,
  options?: {
    locale?: string;
    /** When true, amount is already major units (RWF francs). When false, minor units (cents). */
    zeroDecimal?: boolean;
  },
): string {
  const locale = options?.locale ?? siteLocaleTag();
  const zeroDecimal =
    options?.zeroDecimal ??
    ["RWF", "JPY", "KRW", "VND", "CLP"].includes(currency.toUpperCase());
  const value = zeroDecimal ? Math.round(amount) : amount / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      currencyDisplay: "code",
      minimumFractionDigits: zeroDecimal ? 0 : value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: zeroDecimal ? 0 : 2,
    }).format(value);
  } catch {
    const number = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: zeroDecimal ? 0 : 2,
      maximumFractionDigits: zeroDecimal ? 0 : 2,
    }).format(value);
    return `${currency.toUpperCase()} ${number}`;
  }
}

export function formatDateIntl(
  input: string | number | Date,
  options?: Intl.DateTimeFormatOptions & { locale?: string },
): string {
  const { locale = siteLocaleTag(), ...formatOptions } = options ?? {};
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    timeZone: SITE_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    ...formatOptions,
  }).format(date);
}

export function formatNumberIntl(
  value: number,
  options?: Intl.NumberFormatOptions & { locale?: string },
): string {
  const { locale = siteLocaleTag(), ...formatOptions } = options ?? {};
  return new Intl.NumberFormat(locale, formatOptions).format(value);
}
