import type { CollectionSlug, Product, Vendor } from "@/lib/types";
import { collections } from "@/data/catalog";

const CITY_MOTIF: Record<string, { motif: string; note: string }> = {
  Kigali: {
    motif: "Imigongo geometry",
    note: "Cow-dung relief patterns from Rwanda · structure, contrast, ritual mark.",
  },
  Nairobi: {
    motif: "Savanna dye work",
    note: "Sun-washed cloth logic · heavy hand-feel, long wear, open horizon.",
  },
  Lagos: {
    motif: "Night-market graphics",
    note: "After-dark energy · bold cuts, rust accents, city rhythm.",
  },
  Accra: {
    motif: "Coastal craft goods",
    note: "Small-batch accessories with coastal trade memory in the finish.",
  },
};

const SEASON_LINE: Record<CollectionSlug, string> = {
  "dust-season": "Cut for long days and cold nights · bleached neutrals, heavyweight cloth.",
  "rodeo-nights": "Sharper silhouettes for after the sun goes down.",
  "bone-basics": "The permanent line · restocked, never redesigned.",
};

export type CraftPassportData = {
  origin: string;
  season: string;
  seasonSlug: CollectionSlug;
  seasonLine: string;
  fabric: string;
  fit: string;
  motif: string;
  motifNote: string;
  makerLine: string;
  brandName: string;
  brandHref: string;
};

export function buildCraftPassport(
  product: Product,
  vendor: Vendor | null,
): CraftPassportData {
  const origin =
    vendor?.location ?? product.brandLocation ?? "AFREEKA";
  const cityKey = origin.split(",")[0]?.trim() ?? origin;
  const motifMeta = CITY_MOTIF[cityKey] ?? {
    motif: "Living craft languages",
    note: "Motifs and materials carried into modern city wear · not costume.",
  };
  const season =
    collections.find((c) => c.slug === product.collection)?.name ??
    product.collection;
  const brandName =
    vendor?.name ?? product.brandName ?? "Independent maker";
  const brandSlug = vendor?.slug ?? product.brandSlug;
  const makerLine =
    vendor?.shortBio?.split(".")[0]?.trim() ??
    `${brandName} · MADE IN AFREEKA maker on the floor.`;

  return {
    origin,
    season,
    seasonSlug: product.collection,
    seasonLine: SEASON_LINE[product.collection] ?? "",
    fabric: product.fabric,
    fit: product.fit,
    motif: motifMeta.motif,
    motifNote: motifMeta.note,
    makerLine: makerLine.endsWith(".") ? makerLine : `${makerLine}.`,
    brandName,
    brandHref: brandSlug ? `/brands/${brandSlug}` : "/brands",
  };
}
