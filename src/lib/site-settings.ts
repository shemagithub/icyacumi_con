import { backendFetch } from "@/lib/backend";
import { compressImageFile } from "@/lib/compress-image";
import { site as staticSite } from "@/lib/site";
import { defaultSiteTheme, parseThemeJson, type SiteTheme } from "@/lib/site-theme";
import { cache } from "react";

export type PublicSiteSettings = {
  companyName: string;
  shortName: string;
  displayName: string;
  tagline: string;
  madeIn: string;
  email: string;
  phone: string | null;
  logoUrl: string;
  logoAlt: string;
  positioning: string;
  aboutBody: string;
  aboutHeroImageUrl: string;
  pillarArtTitle: string;
  pillarArtBody: string;
  pillarCraftTitle: string;
  pillarCraftBody: string;
  pillarCultureTitle: string;
  pillarCultureBody: string;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  twitter: string | null;
  youtube: string | null;
  website: string | null;
  theme: SiteTheme;
  social: Array<{ href: string; label: string }>;
  updatedAt?: string;
};

export const defaultSiteSettings: PublicSiteSettings = {
  companyName: staticSite.name,
  shortName: staticSite.shortName,
  displayName: staticSite.displayName,
  tagline: staticSite.tagline,
  madeIn: staticSite.madeIn,
  email: staticSite.email,
  phone: staticSite.phone ?? null,
  logoUrl: staticSite.logo.src,
  logoAlt: staticSite.logo.alt,
  positioning: staticSite.positioning,
  aboutBody: `${staticSite.name} designs contemporary luxury streetwear from African craft languages and modern cultural experimentation · Imigongo geometry, ceremonial marks, hand-finished surfaces. Not costume. Not nostalgia. A way of seeing.`,
  aboutHeroImageUrl: "/scenes/editorial-ranch.jpg",
  pillarArtTitle: "Art",
  pillarArtBody:
    "Every drop starts as visual culture · mask geometry, paint, and marks that mean something beyond decoration.",
  pillarCraftTitle: "Craftsmanship",
  pillarCraftBody:
    "Heavy fabrics, small runs, finishes you can feel. Luxury streetwear built with intention, not volume.",
  pillarCultureTitle: "Cultural experiment",
  pillarCultureBody:
    "African making meets modern city wear. We experiment in silhouette and surface · rooted, never costume.",
  instagram: staticSite.social[0]?.href ?? null,
  tiktok: staticSite.social[1]?.href ?? null,
  facebook: null,
  twitter: null,
  youtube: null,
  website: null,
  theme: defaultSiteTheme,
  social: [...staticSite.social],
};

export function normalizeSiteSettings(
  raw: Partial<PublicSiteSettings> | null | undefined,
): PublicSiteSettings {
  if (!raw) return defaultSiteSettings;
  const social =
    Array.isArray(raw.social) && raw.social.length
      ? raw.social
          .map((item) => ({
            href: String(item?.href ?? "").trim(),
            label: String(item?.label ?? "").trim() || "Link",
          }))
          .filter((item) => item.href)
      : defaultSiteSettings.social;

  return {
    companyName: String(raw.companyName ?? defaultSiteSettings.companyName).trim() || defaultSiteSettings.companyName,
    shortName: String(raw.shortName ?? defaultSiteSettings.shortName).trim() || defaultSiteSettings.shortName,
    displayName: String(raw.displayName ?? defaultSiteSettings.displayName).trim() || defaultSiteSettings.displayName,
    tagline: String(raw.tagline ?? defaultSiteSettings.tagline).trim() || defaultSiteSettings.tagline,
    madeIn: String(raw.madeIn ?? defaultSiteSettings.madeIn).trim() || defaultSiteSettings.madeIn,
    email: String(raw.email ?? defaultSiteSettings.email).trim() || defaultSiteSettings.email,
    phone: raw.phone ? String(raw.phone).trim().slice(0, 40) || null : null,
    logoUrl: String(raw.logoUrl ?? defaultSiteSettings.logoUrl).trim() || defaultSiteSettings.logoUrl,
    logoAlt: String(raw.logoAlt ?? defaultSiteSettings.logoAlt).trim() || defaultSiteSettings.logoAlt,
    positioning: String(raw.positioning ?? defaultSiteSettings.positioning).trim() || defaultSiteSettings.positioning,
    aboutBody: String(raw.aboutBody ?? defaultSiteSettings.aboutBody).trim() || defaultSiteSettings.aboutBody,
    aboutHeroImageUrl:
      String(raw.aboutHeroImageUrl ?? defaultSiteSettings.aboutHeroImageUrl).trim() ||
      defaultSiteSettings.aboutHeroImageUrl,
    pillarArtTitle: String(raw.pillarArtTitle ?? defaultSiteSettings.pillarArtTitle).trim() || defaultSiteSettings.pillarArtTitle,
    pillarArtBody: String(raw.pillarArtBody ?? defaultSiteSettings.pillarArtBody).trim() || defaultSiteSettings.pillarArtBody,
    pillarCraftTitle: String(raw.pillarCraftTitle ?? defaultSiteSettings.pillarCraftTitle).trim() || defaultSiteSettings.pillarCraftTitle,
    pillarCraftBody: String(raw.pillarCraftBody ?? defaultSiteSettings.pillarCraftBody).trim() || defaultSiteSettings.pillarCraftBody,
    pillarCultureTitle: String(raw.pillarCultureTitle ?? defaultSiteSettings.pillarCultureTitle).trim() || defaultSiteSettings.pillarCultureTitle,
    pillarCultureBody: String(raw.pillarCultureBody ?? defaultSiteSettings.pillarCultureBody).trim() || defaultSiteSettings.pillarCultureBody,
    instagram: raw.instagram ?? null,
    tiktok: raw.tiktok ?? null,
    facebook: raw.facebook ?? null,
    twitter: raw.twitter ?? null,
    youtube: raw.youtube ?? null,
    website: raw.website ?? null,
    theme: parseThemeJson(raw.theme),
    social,
    updatedAt: raw.updatedAt,
  };
}

/** Server-side fetch (layout / pages). Falls back to defaults if backend is down. */
export const fetchPublicSiteSettings = cache(
  async (): Promise<PublicSiteSettings> => {
    try {
      const response = await backendFetch("/api/catalog/site-settings");
      if (!response.ok) return defaultSiteSettings;
      const data = (await response.json()) as {
        settings?: Partial<PublicSiteSettings>;
      };
      return normalizeSiteSettings(data.settings);
    } catch {
      return defaultSiteSettings;
    }
  },
);

/** Compress / resize a logo for LongText storage (keeps PNG when possible). */
export async function fileToLogoDataUrl(file: File, maxSize = 400): Promise<string> {
  return compressImageFile(file, {
    maxEdge: maxSize,
    preferPng: true,
    quality: 0.82,
    maxBytes: 120_000,
  });
}

/** Wide About-page hero · JPEG for smaller payload. */
export async function fileToHeroDataUrl(file: File, maxWidth = 1280): Promise<string> {
  return compressImageFile(file, {
    maxEdge: maxWidth,
    quality: 0.74,
    maxBytes: 280_000,
  });
}

/** Storefront background art · JPEG to keep theme JSON small. */
export async function fileToPatternDataUrl(file: File, maxWidth = 1100): Promise<string> {
  return compressImageFile(file, {
    maxEdge: maxWidth,
    quality: 0.7,
    maxBytes: 220_000,
  });
}
