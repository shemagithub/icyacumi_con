import type { CartLine } from "@/lib/types";

export const BUY_NOW_KEY = "bone-buy-now.v1";

export function saveBuyNowLines(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify(lines));
}

export function readBuyNowLines(): CartLine[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BUY_NOW_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed as CartLine[];
  } catch {
    return null;
  }
}

export function clearBuyNowLines() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(BUY_NOW_KEY);
}
