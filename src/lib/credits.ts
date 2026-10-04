import type { Credit } from "@/lib/types";

export const CREDIT_ROLES = [
  "Shout-out",
  "Photographer",
  "Videographer",
  "Designer",
  "Stylist",
  "Model",
  "Tailor",
  "Maker",
  "DJ",
  "Creative director",
] as const;

const MAX_CREDITS = 12;

function safeUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function parseCredits(value: unknown): Credit[] {
  if (!Array.isArray(value)) return [];
  const credits: Credit[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const name = String(row.name ?? "").trim().slice(0, 80);
    if (!name) continue;
    const role = String(row.role ?? "Shout-out").trim().slice(0, 40) || "Shout-out";
    const url = typeof row.url === "string" ? safeUrl(row.url) : undefined;
    credits.push(url ? { role, name, url } : { role, name });
    if (credits.length >= MAX_CREDITS) break;
  }
  return credits;
}
