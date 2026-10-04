"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { SiteFontLoader } from "@/components/site-font-loader";
import {
  DISPLAY_FONTS,
  FONT_VIBE_LABEL,
  DISPLAY_FONT_VIBES,
  getDisplayFont,
} from "@/lib/site-fonts";
import { fileToPatternDataUrl } from "@/lib/site-settings";
import {
  defaultSiteTheme,
  THEME_ART_FITS,
  THEME_ATMOSPHERES,
  THEME_COLUMNS,
  THEME_FONTS,
  THEME_FRAMES,
  THEME_GAPS,
  THEME_INPUT_FILLS,
  THEME_INPUT_STYLES,
  THEME_PATTERNS,
  THEME_RADII,
  THEME_SIZES,
  parseThemeJson,
  resolveAtmosphere,
  type SiteTheme,
} from "@/lib/site-theme";

const FRAME_LABEL: Record<SiteTheme["cardFrame"], string> = {
  craft: "Craft clip",
  line: "Thin line",
  shadow: "Soft shadow",
  none: "No frame",
};

const PATTERN_LABEL: Record<SiteTheme["pattern"], string> = {
  imigongo: "Imigongo + denim",
  custom: "Your art",
  denim: "Denim only",
  grid: "Paper grid",
  none: "Flat color",
};

const ATMOSPHERE_LABEL: Record<(typeof THEME_ATMOSPHERES)[number], string> = {
  auto: "Auto (season + day/night)",
  off: "Off",
  "summer-day": "Summer · sunlight",
  "summer-night": "Summer · night light",
  "winter-day": "Winter · snow",
  "winter-night": "Winter · night + light snow",
};

const INPUT_STYLE_LABEL: Record<SiteTheme["inputStyle"], string> = {
  craft: "Craft edge",
  line: "Clean line",
  soft: "Soft round",
  pill: "Pill",
  underline: "Underline",
};

const INPUT_FILL_LABEL: Record<SiteTheme["inputFill"], string> = {
  paper: "Paper",
  clear: "Light clear",
  tint: "Accent tint",
};

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
  names,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  names?: Record<string, string>;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold tracking-[0.12em] text-[var(--portal-muted)] uppercase">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
              value === option
                ? "bg-[var(--portal-ink)] text-white"
                : "bg-[var(--portal-bg)] text-[var(--portal-muted)] hover:text-[var(--portal-ink)]"
            }`}
          >
            {names?.[option] ?? option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function FontPicker({
  label,
  value,
  sample,
  onChange,
}: {
  label: string;
  value: string;
  sample: string;
  onChange: (id: string) => void;
}) {
  const font = getDisplayFont(value);
  const casual =
    font.vibe === "casual" || font.vibe === "fancy" || font.vibe === "crazy";

  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold tracking-[0.12em] text-[var(--portal-muted)] uppercase">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="portal-input appearance-none"
      >
        {DISPLAY_FONT_VIBES.map((vibe) => (
          <optgroup key={vibe} label={FONT_VIBE_LABEL[vibe]}>
            {DISPLAY_FONTS.filter((entry) => entry.vibe === vibe).map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <p
        className="rounded-2xl bg-[var(--portal-bg)] px-4 py-5 text-[2rem] leading-none"
        style={{
          fontFamily: font.family,
          fontWeight: 400,
          textTransform: casual ? "none" : "uppercase",
        }}
      >
        {sample}
      </p>
      <span className="block text-xs text-[var(--portal-muted)]">{font.label}</span>
    </label>
  );
}

export default function AdminDesignPage() {
  const [theme, setTheme] = useState<SiteTheme>(defaultSiteTheme);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/site-settings", {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to load design settings.");
        return;
      }
      setTheme(parseThemeJson(data.settings?.theme));
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function patch<K extends keyof SiteTheme>(key: K, value: SiteTheme[K]) {
    setTheme((prev) => ({ ...prev, [key]: value }));
  }

  async function onArtFile(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const patternArtUrl = await fileToPatternDataUrl(file);
      setTheme((prev) => ({ ...prev, pattern: "custom", patternArtUrl }));
    } catch {
      setError("Could not process that image. Try a smaller JPG or PNG.");
    }
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not save design.");
        return;
      }
      setTheme(parseThemeJson(data.settings?.theme));
      setMessage("Storefront look saved. Open the shop to see grids, frames, type, and season light.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--portal-muted)]">Loading design…</p>;
  }

  const navSample = getDisplayFont(theme.navFont);
  const brandSample = getDisplayFont(theme.brandFont);

  return (
    <div className="space-y-6">
      <SiteFontLoader fontIds={[theme.navFont, theme.brandFont]} />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="admin-section-title">Client website</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Look & feel</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--portal-muted)]">
            Change the public storefront — product grid columns, card frames, background
            wash, and type size. These controls do not change the admin panel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/website" className="portal-btn portal-btn--ghost !py-2 !text-xs">
            Website copy
          </Link>
          <Link
            href="/shop"
            target="_blank"
            rel="noreferrer"
            className="portal-btn portal-btn--ghost !py-2 !text-xs"
          >
            View shop
          </Link>
        </div>
      </header>

      {message ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-[var(--portal-accent)]">
          {error}
        </p>
      ) : null}

      <form onSubmit={onSave} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <div className="space-y-6">
          <section className="portal-card space-y-5 p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Background</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">Paper</span>
                <input
                  type="color"
                  value={theme.backgroundColor}
                  onChange={(event) => patch("backgroundColor", event.target.value)}
                  className="h-11 w-full cursor-pointer rounded-xl border border-[var(--portal-line)] bg-white p-1"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">Ink</span>
                <input
                  type="color"
                  value={theme.inkColor}
                  onChange={(event) => patch("inkColor", event.target.value)}
                  className="h-11 w-full cursor-pointer rounded-xl border border-[var(--portal-line)] bg-white p-1"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">Accent</span>
                <input
                  type="color"
                  value={theme.accentColor}
                  onChange={(event) => patch("accentColor", event.target.value)}
                  className="h-11 w-full cursor-pointer rounded-xl border border-[var(--portal-line)] bg-white p-1"
                />
              </label>
            </div>
            <Choice
              label="Wash / pattern"
              value={theme.pattern}
              options={THEME_PATTERNS}
              names={PATTERN_LABEL}
              onChange={(value) => patch("pattern", value)}
            />
            <div className="space-y-3 rounded-2xl bg-[var(--portal-bg)] p-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.12em] text-[var(--portal-muted)] uppercase">
                  Replace Imigongo with your art
                </p>
                <p className="mt-1 text-xs text-[var(--portal-muted)]">
                  Upload a photo or pattern, or paste a path / URL. Then choose Your art.
                  Clear to go back to Imigongo anytime.
                </p>
              </div>
              {theme.patternArtUrl ? (
                <div
                  className="h-28 overflow-hidden rounded-xl border border-[var(--portal-line)] bg-white bg-cover bg-center"
                  style={{ backgroundImage: `url(${JSON.stringify(theme.patternArtUrl)})` }}
                />
              ) : (
                <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-[var(--portal-line)] text-xs text-[var(--portal-muted)]">
                  No custom art yet
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">Upload image</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      void onArtFile(event.target.files?.[0] ?? null);
                      event.currentTarget.value = "";
                    }}
                    className="block w-full text-sm text-[var(--portal-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--portal-accent)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">Or image URL / path</span>
                  <input
                    value={theme.patternArtUrl.startsWith("data:") ? "" : theme.patternArtUrl}
                    onChange={(event) => {
                      const patternArtUrl = event.target.value.trim();
                      setTheme((prev) => ({
                        ...prev,
                        patternArtUrl,
                        pattern: patternArtUrl ? "custom" : prev.pattern,
                      }));
                    }}
                    className="portal-input"
                    placeholder="/patterns/imigongo.png or https://…"
                  />
                </label>
              </div>
              <Choice
                label="How the art sits"
                value={theme.patternArtFit}
                options={THEME_ART_FITS}
                names={{ cover: "Fill the screen", tile: "Repeat like a pattern" }}
                onChange={(value) => patch("patternArtFit", value)}
              />
              {theme.patternArtUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    setTheme((prev) => ({
                      ...prev,
                      patternArtUrl: "",
                      pattern: "imigongo",
                    }))
                  }
                  className="text-xs font-semibold tracking-[0.12em] text-[var(--portal-accent)] uppercase underline"
                >
                  Clear art · use Imigongo again
                </button>
              ) : null}
            </div>
            <div className="space-y-3 rounded-2xl bg-[var(--portal-bg)] p-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.12em] text-[var(--portal-muted)] uppercase">
                  Season light & weather
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--portal-muted)]">
                  Changes the active phone-dock spotlight and page weather. Auto uses
                  Dec–Feb as winter and 6am–6pm as day. Or lock a look below.
                </p>
              </div>
              <Choice
                label="Atmosphere"
                value={theme.atmosphere}
                options={THEME_ATMOSPHERES}
                names={ATMOSPHERE_LABEL}
                onChange={(value) => patch("atmosphere", value)}
              />
              <p className="text-xs text-[var(--portal-muted)]">
                Live now:{" "}
                <span className="font-semibold text-[var(--portal-ink)]">
                  {ATMOSPHERE_LABEL[resolveAtmosphere(theme.atmosphere)]}
                </span>
              </p>
            </div>
          </section>

          <section className="portal-card space-y-5 p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Product grids</h2>
            <Choice
              label="Columns on large screens"
              value={String(theme.gridColumns)}
              options={THEME_COLUMNS.map(String)}
              onChange={(value) => patch("gridColumns", Number(value) as SiteTheme["gridColumns"])}
            />
            <Choice
              label="Gap between cards"
              value={theme.gridGap}
              options={THEME_GAPS}
              onChange={(value) => patch("gridGap", value)}
            />
            <Choice
              label="Card frame"
              value={theme.cardFrame}
              options={THEME_FRAMES}
              names={FRAME_LABEL}
              onChange={(value) => patch("cardFrame", value)}
            />
            <Choice
              label="Card corners"
              value={theme.cardRadius}
              options={THEME_RADII}
              onChange={(value) => patch("cardRadius", value)}
            />
          </section>

          <section className="portal-card space-y-5 p-5 sm:p-6">
            <div>
              <h2 className="text-sm font-semibold">Form fields</h2>
              <p className="mt-1 text-xs text-[var(--portal-muted)]">
                Shape and fill for storefront inputs · login, signup, contact, checkout,
                and shop filters.
              </p>
            </div>
            <Choice
              label="Field shape"
              value={theme.inputStyle}
              options={THEME_INPUT_STYLES}
              names={INPUT_STYLE_LABEL}
              onChange={(value) => patch("inputStyle", value)}
            />
            <Choice
              label="Field fill"
              value={theme.inputFill}
              options={THEME_INPUT_FILLS}
              names={INPUT_FILL_LABEL}
              onChange={(value) => patch("inputFill", value)}
            />
            <div
              className="rounded-2xl p-4"
              style={
                {
                  background: theme.backgroundColor,
                  color: theme.inkColor,
                  ["--color-bone" as string]: theme.backgroundColor,
                  ["--color-coal" as string]: theme.inkColor,
                  ["--color-rust" as string]: theme.accentColor,
                } as React.CSSProperties
              }
              data-store-input={theme.inputStyle}
              data-store-input-fill={theme.inputFill}
            >
              <p className="mb-2 text-[0.65rem] font-semibold tracking-[0.14em] uppercase opacity-60">
                Live preview
              </p>
              <label className="block space-y-1.5">
                <span className="text-xs opacity-70">Email</span>
                <input
                  readOnly
                  className="field-input"
                  placeholder="you@brand.com"
                  defaultValue="studio@icyacumi.com"
                />
              </label>
            </div>
          </section>

          <section className="portal-card space-y-6 p-5 sm:p-6">
            <div>
              <h2 className="text-sm font-semibold">Navbar & company name</h2>
              <p className="mt-1 text-xs text-[var(--portal-muted)]">
                Pick a face. The large line below is the live preview. Save, then open
                the shop — the company name and nav (including the phone dock) use it.
              </p>
            </div>
            <FontPicker
              label="Navbar links"
              value={theme.navFont}
              sample="Shop · Events · Brands"
              onChange={(id) => patch("navFont", id)}
            />
            <FontPicker
              label="Company name"
              value={theme.brandFont}
              sample="ICYACUMI"
              onChange={(id) => patch("brandFont", id)}
            />
            <Choice
              label="Page body type"
              value={theme.fontStyle}
              options={THEME_FONTS}
              names={{ brand: "Brand (current)", sans: "Clean sans", serif: "Serif" }}
              onChange={(value) => patch("fontStyle", value)}
            />
            <Choice
              label="Base size"
              value={theme.fontSize}
              options={THEME_SIZES}
              onChange={(value) => patch("fontSize", value)}
            />
          </section>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={pending} className="portal-btn portal-btn--primary">
              {pending ? "Saving…" : "Save look & feel"}
            </button>
            <button
              type="button"
              onClick={() => setTheme(defaultSiteTheme)}
              className="portal-btn portal-btn--ghost"
            >
              Reset to original
            </button>
          </div>
        </div>

        <aside className="portal-card h-fit space-y-4 p-5">
          <h2 className="text-sm font-semibold">Preview</h2>
          <p className="text-xs text-[var(--portal-muted)]">
            Approximate shop grid. Save, then open the shop to confirm.
          </p>
          <div
            className="overflow-hidden rounded-2xl p-4"
            style={{
              background: theme.backgroundColor,
              color: theme.inkColor,
              fontFamily:
                theme.fontStyle === "serif"
                  ? "Georgia, serif"
                  : theme.fontStyle === "sans"
                    ? "system-ui, sans-serif"
                    : "inherit",
              fontSize: theme.fontSize === "small" ? "0.8rem" : theme.fontSize === "large" ? "1.05rem" : "0.9rem",
            }}
          >
            <p
              className="mb-1 text-2xl leading-tight"
              style={{ fontFamily: brandSample.family, fontWeight: 400 }}
            >
              ICYACUMI
            </p>
            <p
              className="mb-3 text-lg"
              style={{ color: theme.accentColor, fontFamily: navSample.family, fontWeight: 400 }}
            >
              Shop · Events · Brands
            </p>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${theme.gridColumns}, minmax(0, 1fr))`,
                gap: theme.gridGap === "tight" ? "0.4rem" : theme.gridGap === "wide" ? "0.9rem" : "0.6rem",
              }}
            >
              {Array.from({ length: theme.gridColumns }).map((_, index) => (
                <div
                  key={index}
                  style={{
                    aspectRatio: "4 / 5",
                    background: index % 2 ? "#d0c2ae" : "#c45c26",
                    borderRadius:
                      theme.cardRadius === "sharp" ? 0 : theme.cardRadius === "round" ? 16 : 10,
                    boxShadow: theme.cardFrame === "shadow" ? "0 8px 16px rgba(0,0,0,0.16)" : "none",
                    border:
                      theme.cardFrame === "line" ? `1px solid ${theme.inkColor}33` : "none",
                    clipPath:
                      theme.cardFrame === "craft"
                        ? "polygon(0 8%, 8% 0, 100% 0, 100% 92%, 92% 100%, 0 100%)"
                        : "none",
                  }}
                />
              ))}
            </div>
            <p className="mt-3 text-sm font-semibold">Sample product title</p>
            <p className="text-xs" style={{ color: theme.accentColor }}>
              {PATTERN_LABEL[theme.pattern]} · {ATMOSPHERE_LABEL[theme.atmosphere]}
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
