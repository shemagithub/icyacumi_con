import { prisma } from "./db.js";

export const SITE_SETTINGS_ID = "default";

export type SiteSettingsDto = {
  id: string;
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
  social: Array<{ href: string; label: string }>;
  updatedAt: string;
};

const DEFAULTS = {
  companyName: "BONE KOBOYI",
  shortName: "BK",
  displayName: "BONE_KOBOYI",
  tagline: "Shop. Events. Ads.",
  madeIn: "MADE IN AFREEKA",
  email: "fit@bonekoboyi.com",
  phone: null as string | null,
  logoUrl: "/brand/logo.png",
  logoAlt: "BONE KOBOYI / MADE IN AFREEKA mark",
  positioning:
    "Shop products, book event tickets, and run ads · MADE IN AFREEKA, all in one place.",
  aboutBody:
    "BONE KOBOYI designs contemporary luxury streetwear from African craft languages and modern cultural experimentation · Imigongo geometry, ceremonial marks, hand-finished surfaces. Not costume. Not nostalgia. A way of seeing.",
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
  instagram: "https://instagram.com",
  tiktok: "https://tiktok.com",
  facebook: null as string | null,
  twitter: null as string | null,
  youtube: null as string | null,
  website: null as string | null,
};

function trimOrNull(value: unknown, max = 255): string | null {
  const text = String(value ?? "").trim().slice(0, max);
  return text || null;
}

function buildSocial(row: {
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  twitter: string | null;
  youtube: string | null;
  website: string | null;
}): Array<{ href: string; label: string }> {
  const entries: Array<{ href: string; label: string; value: string | null }> = [
    { href: "", label: "Instagram", value: row.instagram },
    { href: "", label: "TikTok", value: row.tiktok },
    { href: "", label: "Facebook", value: row.facebook },
    { href: "", label: "X / Twitter", value: row.twitter },
    { href: "", label: "YouTube", value: row.youtube },
    { href: "", label: "Website", value: row.website },
  ];
  return entries
    .filter((entry) => Boolean(entry.value))
    .map((entry) => ({
      href: String(entry.value),
      label: entry.label,
    }));
}

function mapRow(row: {
  id: string;
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
  updatedAt: Date;
}): SiteSettingsDto {
  return {
    id: row.id,
    companyName: row.companyName,
    shortName: row.shortName,
    displayName: row.displayName,
    tagline: row.tagline,
    madeIn: row.madeIn,
    email: row.email,
    phone: row.phone,
    logoUrl: row.logoUrl,
    logoAlt: row.logoAlt,
    positioning: row.positioning,
    aboutBody: row.aboutBody,
    aboutHeroImageUrl: row.aboutHeroImageUrl,
    pillarArtTitle: row.pillarArtTitle,
    pillarArtBody: row.pillarArtBody,
    pillarCraftTitle: row.pillarCraftTitle,
    pillarCraftBody: row.pillarCraftBody,
    pillarCultureTitle: row.pillarCultureTitle,
    pillarCultureBody: row.pillarCultureBody,
    instagram: row.instagram,
    tiktok: row.tiktok,
    facebook: row.facebook,
    twitter: row.twitter,
    youtube: row.youtube,
    website: row.website,
    social: buildSocial(row),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function ensureSiteSettings() {
  await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    update: {},
    create: {
      id: SITE_SETTINGS_ID,
      ...DEFAULTS,
    },
  });
}

export async function getSiteSettings(): Promise<SiteSettingsDto> {
  await ensureSiteSettings();
  const row = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
  });
  if (!row) {
    return {
      id: SITE_SETTINGS_ID,
      ...DEFAULTS,
      social: buildSocial(DEFAULTS),
      updatedAt: new Date().toISOString(),
    };
  }
  return mapRow(row);
}

export type SiteSettingsPatch = Partial<{
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
}>;

export function parseSiteSettingsPatch(body: Record<string, unknown>): {
  data?: SiteSettingsPatch;
  error?: string;
} {
  const data: SiteSettingsPatch = {};

  if (body.companyName !== undefined) {
    const companyName = String(body.companyName ?? "").trim().slice(0, 120);
    if (!companyName) return { error: "Company name is required." };
    data.companyName = companyName;
  }
  if (body.shortName !== undefined) {
    const shortName = String(body.shortName ?? "").trim().slice(0, 40);
    if (!shortName) return { error: "Short name is required." };
    data.shortName = shortName;
  }
  if (body.displayName !== undefined) {
    data.displayName = String(body.displayName ?? "").trim().slice(0, 120) || DEFAULTS.displayName;
  }
  if (body.tagline !== undefined) {
    data.tagline = String(body.tagline ?? "").trim().slice(0, 255) || DEFAULTS.tagline;
  }
  if (body.madeIn !== undefined) {
    data.madeIn = String(body.madeIn ?? "").trim().slice(0, 120) || DEFAULTS.madeIn;
  }
  if (body.email !== undefined) {
    const email = String(body.email ?? "").trim().toLowerCase().slice(0, 255);
    if (!email.includes("@")) return { error: "A valid contact email is required." };
    data.email = email;
  }
  if (body.phone !== undefined) {
    data.phone = trimOrNull(body.phone, 40);
  }
  if (body.logoUrl !== undefined) {
    const logoUrl = String(body.logoUrl ?? "").trim();
    if (!logoUrl) return { error: "Logo is required." };
    if (logoUrl.length > 900_000) return { error: "Logo file is too large." };
    data.logoUrl = logoUrl;
  }
  if (body.logoAlt !== undefined) {
    data.logoAlt = String(body.logoAlt ?? "").trim().slice(0, 255) || DEFAULTS.logoAlt;
  }
  if (body.positioning !== undefined) {
    data.positioning =
      String(body.positioning ?? "").trim().slice(0, 2000) || DEFAULTS.positioning;
  }
  if (body.aboutBody !== undefined) {
    const aboutBody = String(body.aboutBody ?? "").trim().slice(0, 50_000);
    if (!aboutBody) return { error: "About page body is required." };
    data.aboutBody = aboutBody;
  }
  if (body.aboutHeroImageUrl !== undefined) {
    const aboutHeroImageUrl = String(body.aboutHeroImageUrl ?? "").trim();
    if (!aboutHeroImageUrl) {
      data.aboutHeroImageUrl = DEFAULTS.aboutHeroImageUrl;
    } else if (aboutHeroImageUrl.length > 900_000) {
      return { error: "About hero image is too large. Use a smaller photo." };
    } else {
      data.aboutHeroImageUrl = aboutHeroImageUrl;
    }
  }
  if (body.pillarArtTitle !== undefined) {
    data.pillarArtTitle =
      String(body.pillarArtTitle ?? "").trim().slice(0, 80) || DEFAULTS.pillarArtTitle;
  }
  if (body.pillarArtBody !== undefined) {
    data.pillarArtBody =
      String(body.pillarArtBody ?? "").trim().slice(0, 4000) || DEFAULTS.pillarArtBody;
  }
  if (body.pillarCraftTitle !== undefined) {
    data.pillarCraftTitle =
      String(body.pillarCraftTitle ?? "").trim().slice(0, 80) || DEFAULTS.pillarCraftTitle;
  }
  if (body.pillarCraftBody !== undefined) {
    data.pillarCraftBody =
      String(body.pillarCraftBody ?? "").trim().slice(0, 4000) || DEFAULTS.pillarCraftBody;
  }
  if (body.pillarCultureTitle !== undefined) {
    data.pillarCultureTitle =
      String(body.pillarCultureTitle ?? "").trim().slice(0, 80) ||
      DEFAULTS.pillarCultureTitle;
  }
  if (body.pillarCultureBody !== undefined) {
    data.pillarCultureBody =
      String(body.pillarCultureBody ?? "").trim().slice(0, 4000) ||
      DEFAULTS.pillarCultureBody;
  }

  if (body.instagram !== undefined) data.instagram = trimOrNull(body.instagram);
  if (body.tiktok !== undefined) data.tiktok = trimOrNull(body.tiktok);
  if (body.facebook !== undefined) data.facebook = trimOrNull(body.facebook);
  if (body.twitter !== undefined) data.twitter = trimOrNull(body.twitter);
  if (body.youtube !== undefined) data.youtube = trimOrNull(body.youtube);
  if (body.website !== undefined) data.website = trimOrNull(body.website);

  if (!Object.keys(data).length) {
    return { error: "No changes provided." };
  }
  return { data };
}

export async function updateSiteSettings(patch: SiteSettingsPatch) {
  await ensureSiteSettings();
  const row = await prisma.siteSettings.update({
    where: { id: SITE_SETTINGS_ID },
    data: patch,
  });
  return mapRow(row);
}
