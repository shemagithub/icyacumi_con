import { DISPLAY_FONT_IDS, getDisplayFont } from "@/lib/site-fonts";

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
export type ResolvedAtmosphere = Exclude<ThemeAtmosphere, "auto">;

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
  /** Seasonal dock light + page weather · auto follows month + day/night clock. */
  atmosphere: ThemeAtmosphere;
  /** Storefront form field shape. */
  inputStyle: ThemeInputStyle;
  /** Storefront form field fill. */
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

export function sanitizeArtUrl(value: unknown): string {
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

/** Dec–Feb = winter · rest = summer. Day = 06:00–17:59 local. */
export function resolveAtmosphere(
  setting: ThemeAtmosphere,
  now: Date = new Date(),
): ResolvedAtmosphere {
  if (setting !== "auto") return setting;
  const month = now.getMonth(); // 0–11
  const hour = now.getHours();
  const winter = month === 11 || month === 0 || month === 1;
  const day = hour >= 6 && hour < 18;
  if (winter) return day ? "winter-day" : "winter-night";
  return day ? "summer-day" : "summer-night";
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
    navFont: oneOf(data.navFont, DISPLAY_FONT_IDS, defaultSiteTheme.navFont),
    brandFont: oneOf(data.brandFont, DISPLAY_FONT_IDS, defaultSiteTheme.brandFont),
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

const GAP_PX: Record<ThemeGap, string> = {
  tight: "0.75rem",
  normal: "1.25rem",
  wide: "2rem",
};

const RADIUS_PX: Record<ThemeRadius, string> = {
  sharp: "0px",
  soft: "1rem",
  round: "1.5rem",
};

export function themeCssVars(theme: SiteTheme): Record<string, string> {
  return {
    "--store-bg": theme.backgroundColor,
    "--store-ink": theme.inkColor,
    "--store-accent": theme.accentColor,
    "--store-grid-cols": String(theme.gridColumns),
    "--store-grid-gap": GAP_PX[theme.gridGap],
    "--store-card-radius": RADIUS_PX[theme.cardRadius],
    "--color-bone": theme.backgroundColor,
    "--color-coal": theme.inkColor,
    "--color-rust": theme.accentColor,
    "--store-nav-font": getDisplayFont(theme.navFont).family,
    "--store-brand-font": getDisplayFont(theme.brandFont).family,
    "--store-art": theme.patternArtUrl ? `url(${JSON.stringify(theme.patternArtUrl)})` : "none",
  };
}

export function applyThemeToDocument(
  theme: SiteTheme | null,
  atmosphere?: ResolvedAtmosphere | null,
) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const keys = [
    "--store-bg",
    "--store-ink",
    "--store-accent",
    "--store-grid-cols",
    "--store-grid-gap",
    "--store-card-radius",
    "--color-bone",
    "--color-coal",
    "--color-rust",
    "--store-nav-font",
    "--store-brand-font",
    "--store-art",
  ];
  if (!theme) {
    keys.forEach((key) => root.style.removeProperty(key));
    root.removeAttribute("data-store-pattern");
    root.removeAttribute("data-card-frame");
    root.removeAttribute("data-card-radius");
    root.removeAttribute("data-font-style");
    root.removeAttribute("data-font-size");
    root.removeAttribute("data-nav-vibe");
    root.removeAttribute("data-brand-vibe");
    root.removeAttribute("data-store-atmosphere");
    root.removeAttribute("data-store-input");
    root.removeAttribute("data-store-input-fill");
    return;
  }
  const vars = themeCssVars(theme);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  root.setAttribute("data-store-pattern", theme.pattern);
  root.setAttribute("data-card-frame", theme.cardFrame);
  root.setAttribute("data-card-radius", theme.cardRadius);
  root.setAttribute("data-font-style", theme.fontStyle);
  root.setAttribute("data-font-size", theme.fontSize);
  root.setAttribute("data-nav-vibe", getDisplayFont(theme.navFont).vibe);
  root.setAttribute("data-brand-vibe", getDisplayFont(theme.brandFont).vibe);
  root.setAttribute("data-store-input", theme.inputStyle);
  root.setAttribute("data-store-input-fill", theme.inputFill);
  const resolved = atmosphere ?? resolveAtmosphere(theme.atmosphere);
  if (resolved === "off") root.removeAttribute("data-store-atmosphere");
  else root.setAttribute("data-store-atmosphere", resolved);
}
