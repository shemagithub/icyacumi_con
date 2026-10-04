import { DISPLAY_FONT_IDS } from "./site-fonts.js";

export const THEME_PATTERNS = ["imigongo", "custom", "denim", "grid", "none"] as const;
export const THEME_ART_FITS = ["cover", "tile"] as const;
export const THEME_GAPS = ["tight", "normal", "wide"] as const;
export const THEME_FRAMES = ["craft", "line", "shadow", "none"] as const;
export const THEME_RADII = ["sharp", "soft", "round"] as const;
export const THEME_FONTS = ["brand", "sans", "serif"] as const;
export const THEME_SIZES = ["small", "normal", "large"] as const;
export const THEME_COLUMNS = [2, 3, 4] as const;
export const THEME_ATMOSPHERES = [
  "auto",
  "off",
  "summer-day",
  "summer-night",
  "winter-day",
  "winter-night",
] as const;
export const THEME_INPUT_STYLES = [
  "craft",
  "line",
  "soft",
  "pill",
  "underline",
] as const;
export const THEME_INPUT_FILLS = ["paper", "clear", "tint"] as const;

export type ThemePattern = (typeof THEME_PATTERNS)[number];
export type ThemeArtFit = (typeof THEME_ART_FITS)[number];
export type ThemeGap = (typeof THEME_GAPS)[number];
export type ThemeFrame = (typeof THEME_FRAMES)[number];
export type ThemeRadius = (typeof THEME_RADII)[number];
export type ThemeFont = (typeof THEME_FONTS)[number];
export type ThemeSize = (typeof THEME_SIZES)[number];
export type ThemeColumns = (typeof THEME_COLUMNS)[number];
export type ThemeAtmosphere = (typeof THEME_ATMOSPHERES)[number];
export type ThemeInputStyle = (typeof THEME_INPUT_STYLES)[number];
export type ThemeInputFill = (typeof THEME_INPUT_FILLS)[number];

export type SiteTheme = {
  backgroundColor: string;
  inkColor: string;
  accentColor: string;
  pattern: ThemePattern;
  patternArtUrl: string;
  patternArtFit: ThemeArtFit;
  gridColumns: ThemeColumns;
  gridGap: ThemeGap;
  cardFrame: ThemeFrame;
  cardRadius: ThemeRadius;
  fontStyle: ThemeFont;
  fontSize: ThemeSize;
  navFont: string;
  brandFont: string;
  atmosphere: ThemeAtmosphere;
  inputStyle: ThemeInputStyle;
  inputFill: ThemeInputFill;
};

export const defaultSiteTheme: SiteTheme = {
  backgroundColor: "#f7f1e8",
  inkColor: "#1a1410",
  accentColor: "#e30613",
  pattern: "imigongo",
  patternArtUrl: "",
  patternArtFit: "cover",
  gridColumns: 4,
  gridGap: "normal",
  cardFrame: "craft",
  cardRadius: "soft",
  fontStyle: "brand",
  fontSize: "normal",
  navFont: "marker",
  brandFont: "nunito",
  atmosphere: "auto",
  inputStyle: "craft",
  inputFill: "paper",
};

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function hexColor(value: unknown, fallback: string): string {
  const text = String(value ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(text) ? text.toLowerCase() : fallback;
}

function sanitizeArtUrl(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text || text.length > 900_000) return "";
  if (
    text.startsWith("/") ||
    text.startsWith("http://") ||
    text.startsWith("https://") ||
    text.startsWith("data:image/")
  ) {
    return text;
  }
  return "";
}

export function normalizeSiteTheme(raw: unknown): SiteTheme {
  const data =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const columns = Number(data.gridColumns);
  return {
    backgroundColor: hexColor(data.backgroundColor, defaultSiteTheme.backgroundColor),
    inkColor: hexColor(data.inkColor, defaultSiteTheme.inkColor),
    accentColor: hexColor(data.accentColor, defaultSiteTheme.accentColor),
    pattern: oneOf(data.pattern, THEME_PATTERNS, defaultSiteTheme.pattern),
    patternArtUrl: sanitizeArtUrl(data.patternArtUrl),
    patternArtFit: oneOf(data.patternArtFit, THEME_ART_FITS, defaultSiteTheme.patternArtFit),
    gridColumns: THEME_COLUMNS.includes(columns as ThemeColumns)
      ? (columns as ThemeColumns)
      : defaultSiteTheme.gridColumns,
    gridGap: oneOf(data.gridGap, THEME_GAPS, defaultSiteTheme.gridGap),
    cardFrame: oneOf(data.cardFrame, THEME_FRAMES, defaultSiteTheme.cardFrame),
    cardRadius: oneOf(data.cardRadius, THEME_RADII, defaultSiteTheme.cardRadius),
    fontStyle: oneOf(data.fontStyle, THEME_FONTS, defaultSiteTheme.fontStyle),
    fontSize: oneOf(data.fontSize, THEME_SIZES, defaultSiteTheme.fontSize),
    navFont: oneOf(String(data.navFont ?? ""), DISPLAY_FONT_IDS, defaultSiteTheme.navFont),
    brandFont: oneOf(String(data.brandFont ?? ""), DISPLAY_FONT_IDS, defaultSiteTheme.brandFont),
    atmosphere: oneOf(data.atmosphere, THEME_ATMOSPHERES, defaultSiteTheme.atmosphere),
    inputStyle: oneOf(data.inputStyle, THEME_INPUT_STYLES, defaultSiteTheme.inputStyle),
    inputFill: oneOf(data.inputFill, THEME_INPUT_FILLS, defaultSiteTheme.inputFill),
  };
}

export function parseThemeJson(value: unknown): SiteTheme {
  if (!value) return defaultSiteTheme;
  if (typeof value === "string") {
    try {
      return normalizeSiteTheme(JSON.parse(value));
    } catch {
      return defaultSiteTheme;
    }
  }
  return normalizeSiteTheme(value);
}
