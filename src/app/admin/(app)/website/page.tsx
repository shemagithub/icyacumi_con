"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  defaultSiteSettings,
  fileToHeroDataUrl,
  fileToLogoDataUrl,
  normalizeSiteSettings,
  type PublicSiteSettings,
} from "@/lib/site-settings";

type FormState = PublicSiteSettings;

export default function AdminWebsitePage() {
  const [form, setForm] = useState<FormState>(defaultSiteSettings);
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
        setError(data.error ?? "Failed to load website settings.");
        return;
      }
      setForm(normalizeSiteSettings(data.settings));
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onLogoChange(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const logoUrl = await fileToLogoDataUrl(file);
      update("logoUrl", logoUrl);
      if (!form.logoAlt) update("logoAlt", `${form.companyName} logo`);
    } catch {
      setError("Could not process that logo image.");
    }
  }

  async function onHeroChange(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const aboutHeroImageUrl = await fileToHeroDataUrl(file);
      update("aboutHeroImageUrl", aboutHeroImageUrl);
    } catch {
      setError("Could not process that About hero image.");
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
        body: JSON.stringify({
          companyName: form.companyName,
          shortName: form.shortName,
          displayName: form.displayName,
          tagline: form.tagline,
          madeIn: form.madeIn,
          email: form.email,
          phone: form.phone,
          logoUrl: form.logoUrl,
          logoAlt: form.logoAlt,
          positioning: form.positioning,
          aboutBody: form.aboutBody,
          aboutHeroImageUrl: form.aboutHeroImageUrl,
          pillarArtTitle: form.pillarArtTitle,
          pillarArtBody: form.pillarArtBody,
          pillarCraftTitle: form.pillarCraftTitle,
          pillarCraftBody: form.pillarCraftBody,
          pillarCultureTitle: form.pillarCultureTitle,
          pillarCultureBody: form.pillarCultureBody,
          instagram: form.instagram,
          tiktok: form.tiktok,
          facebook: form.facebook,
          twitter: form.twitter,
          youtube: form.youtube,
          website: form.website,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setForm(normalizeSiteSettings(data.settings));
      setMessage("Website settings saved. Logo, name, contact, socials, and about copy are live.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-[var(--portal-muted)]">Loading website settings…</p>
    );
  }

  const logoIsData = form.logoUrl.startsWith("data:");
  const heroIsData = form.aboutHeroImageUrl.startsWith("data:");
  const heroSrc = form.aboutHeroImageUrl || "/scenes/editorial-ranch.jpg";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="admin-section-title">Client website</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Website
          </h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Logo, name, contact, socials, and About copy on the public storefront.
            Grids, frames, background, and type live under Design.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/design" className="portal-btn portal-btn--ghost !py-2 !text-xs">
            Edit look & feel
          </Link>
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="portal-btn portal-btn--ghost !py-2 !text-xs"
          >
            View site
          </Link>
          <Link
            href="/about"
            target="_blank"
            rel="noreferrer"
            className="portal-btn portal-btn--ghost !py-2 !text-xs"
          >
            View About
          </Link>
          <Link
            href="/contact"
            target="_blank"
            rel="noreferrer"
            className="portal-btn portal-btn--ghost !py-2 !text-xs"
          >
            View Contact
          </Link>
        </div>
      </header>

      {message ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-[var(--portal-accent)]">
          {error}
        </p>
      ) : null}

      <form onSubmit={onSave} className="space-y-6">
        <section className="portal-card space-y-4 p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Brand identity</h2>
          <div className="flex flex-wrap items-center gap-5">
            <div className="craft-frame--soft flex h-24 w-24 items-center justify-center overflow-hidden bg-[var(--portal-bg)]">
              {logoIsData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.logoUrl}
                  alt={form.logoAlt}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Image
                  src={form.logoUrl || "/brand/logo.png"}
                  alt={form.logoAlt}
                  width={96}
                  height={96}
                  className="h-full w-full object-contain"
                />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <label className="block">
                <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                  Upload logo
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(event) => {
                    void onLogoChange(event.target.files?.[0] ?? null);
                    event.currentTarget.value = "";
                  }}
                  className="block w-full text-sm text-[var(--portal-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--portal-accent)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                  Or logo URL / path
                </span>
                <input
                  value={logoIsData ? "" : form.logoUrl}
                  onChange={(event) => update("logoUrl", event.target.value)}
                  placeholder="/brand/logo.png"
                  className="portal-input"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                  Logo alt text
                </span>
                <input
                  value={form.logoAlt}
                  onChange={(event) => update("logoAlt", event.target.value)}
                  className="portal-input"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Company name
              </span>
              <input
                value={form.companyName}
                onChange={(event) => update("companyName", event.target.value)}
                required
                className="portal-input"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Short name
              </span>
              <input
                value={form.shortName}
                onChange={(event) => update("shortName", event.target.value)}
                required
                className="portal-input"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Display name
              </span>
              <input
                value={form.displayName}
                onChange={(event) => update("displayName", event.target.value)}
                className="portal-input"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Tagline
              </span>
              <input
                value={form.tagline}
                onChange={(event) => update("tagline", event.target.value)}
                className="portal-input"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Made-in line
              </span>
              <input
                value={form.madeIn}
                onChange={(event) => update("madeIn", event.target.value)}
                className="portal-input"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Public contact email
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                required
                className="portal-input"
                placeholder="fit@icyacumi.com"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Public phone
              </span>
              <input
                type="tel"
                value={form.phone ?? ""}
                onChange={(event) => update("phone", event.target.value || null)}
                className="portal-input"
                placeholder="+250 7XX XXX XXX"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Short positioning (header / meta / footer)
              </span>
              <textarea
                value={form.positioning}
                onChange={(event) => update("positioning", event.target.value)}
                rows={3}
                className="portal-input min-h-[5rem] resize-y"
              />
            </label>
          </div>
        </section>

        <section className="portal-card space-y-4 p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Social media</h2>
          <p className="text-xs text-[var(--portal-muted)]">
            Shown as icons in the footer, About page, and Contact. Leave blank to hide.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["instagram", "Instagram"],
                ["tiktok", "TikTok"],
                ["facebook", "Facebook"],
                ["twitter", "X / Twitter"],
                ["youtube", "YouTube"],
                ["website", "Website"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block">
                <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                  {label}
                </span>
                <input
                  value={form[key] ?? ""}
                  onChange={(event) =>
                    update(key, event.target.value.trim() ? event.target.value : null)
                  }
                  className="portal-input"
                  placeholder={
                    key === "website"
                      ? "https://icyacumi.com"
                      : `https://${key}.com/icyacumi`
                  }
                />
              </label>
            ))}
          </div>
        </section>

        <section className="portal-card space-y-4 p-5 sm:p-6">
          <h2 className="text-sm font-semibold">About page</h2>
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              Main about story
            </span>
            <textarea
              value={form.aboutBody}
              onChange={(event) => update("aboutBody", event.target.value)}
              rows={5}
              required
              className="portal-input min-h-[8rem] resize-y"
            />
          </label>

          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.12em] text-[var(--portal-muted)] uppercase">
              About hero image
            </p>
            <div className="relative aspect-[21/9] overflow-hidden rounded-2xl border border-[var(--portal-line)] bg-[var(--portal-bg)]">
              {heroIsData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroSrc}
                  alt="About hero preview"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={heroSrc}
                  alt="About hero preview"
                  fill
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                  Upload image
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    void onHeroChange(event.target.files?.[0] ?? null);
                    event.currentTarget.value = "";
                  }}
                  className="block w-full text-sm text-[var(--portal-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--portal-accent)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                  Or image URL / path
                </span>
                <input
                  value={heroIsData ? "" : form.aboutHeroImageUrl}
                  onChange={(event) => update("aboutHeroImageUrl", event.target.value)}
                  className="portal-input"
                  placeholder="/scenes/editorial-ranch.jpg"
                />
              </label>
            </div>
            {heroIsData ? (
              <button
                type="button"
                onClick={() => update("aboutHeroImageUrl", "/scenes/editorial-ranch.jpg")}
                className="text-xs font-semibold tracking-[0.12em] text-[var(--portal-accent)] uppercase underline"
              >
                Clear upload · use default scene
              </button>
            ) : null}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {(
              [
                ["pillarArtTitle", "pillarArtBody", "Pillar 1"],
                ["pillarCraftTitle", "pillarCraftBody", "Pillar 2"],
                ["pillarCultureTitle", "pillarCultureBody", "Pillar 3"],
              ] as const
            ).map(([titleKey, bodyKey, label]) => (
              <div key={titleKey} className="space-y-2 rounded-2xl bg-[var(--portal-bg)] p-4">
                <p className="text-xs font-semibold tracking-[0.12em] text-[var(--portal-muted)] uppercase">
                  {label}
                </p>
                <input
                  value={form[titleKey]}
                  onChange={(event) => update(titleKey, event.target.value)}
                  className="portal-input"
                  placeholder="Title"
                />
                <textarea
                  value={form[bodyKey]}
                  onChange={(event) => update(bodyKey, event.target.value)}
                  rows={4}
                  className="portal-input min-h-[6rem] resize-y"
                  placeholder="Body"
                />
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="portal-btn portal-btn--primary disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save website settings"}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="portal-btn portal-btn--ghost"
          >
            Reset unsaved
          </button>
        </div>
      </form>
    </div>
  );
}
