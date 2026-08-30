"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import { categories, collections } from "@/data/catalog";
import { fileToProductImageDataUrl } from "@/lib/product-images";
import type { CategorySlug, CollectionSlug, Size } from "@/lib/types";

const MAX_IMAGES = 8;

const ALL_SIZES: Size[] = ["XS", "S", "M", "L", "XL", "XXL", "OS"];

const PRESET_COLORS = [
  { name: "Coal", hex: "#17171A" },
  { name: "Bone", hex: "#F3EDE3" },
  { name: "Sand", hex: "#C9A87C" },
  { name: "Rust", hex: "#B5563A" },
  { name: "Olive", hex: "#5C6B4A" },
  { name: "Indigo", hex: "#2F3F6B" },
];

type ColorDraft = { name: string; hex: string };

export type PortalProductPayload = {
  name: string;
  tagline: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  category: CategorySlug;
  collection: CollectionSlug;
  fabric: string;
  fit: string;
  badge: string;
  featured: boolean;
  sizes: Size[];
  colors: ColorDraft[];
  details: string[];
  images: Array<{ src: string; alt: string }>;
};

const EMPTY_FORM = {
  name: "",
  tagline: "",
  description: "",
  price: "",
  compareAtPrice: "",
  stockQuantity: "10",
  category: "tees" as CategorySlug,
  collection: "bone-basics" as CollectionSlug,
  fabric: "",
  fit: "True to size",
  badge: "",
  featured: false,
  sizes: ["S", "M", "L", "XL"] as Size[],
  colors: [{ name: "Coal", hex: "#17171A" }] as ColorDraft[],
  detailsText: "",
  imageSrcs: [] as string[],
};

export function PortalProductFormModal({
  open,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: PortalProductPayload) => Promise<boolean>;
}) {
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [urlDraft, setUrlDraft] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setUrlDraft("");
    setImageError(null);
    setDragging(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, pending, onClose]);

  if (!open) return null;

  function toggleSize(size: Size) {
    setForm((prev) => {
      const has = prev.sizes.includes(size);
      const sizes = has
        ? prev.sizes.filter((value) => value !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes };
    });
  }

  function addImageSrcs(srcs: string[]) {
    const cleaned = srcs.map((src) => src.trim()).filter(Boolean);
    if (!cleaned.length) return;
    setForm((prev) => {
      const next = [...prev.imageSrcs];
      for (const src of cleaned) {
        if (next.includes(src)) continue;
        if (next.length >= MAX_IMAGES) break;
        next.push(src);
      }
      return { ...prev, imageSrcs: next };
    });
  }

  function removeImage(index: number) {
    setForm((prev) => ({
      ...prev,
      imageSrcs: prev.imageSrcs.filter((_, i) => i !== index),
    }));
  }

  function moveImage(index: number, direction: -1 | 1) {
    setForm((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.imageSrcs.length) return prev;
      const imageSrcs = [...prev.imageSrcs];
      const [item] = imageSrcs.splice(index, 1);
      imageSrcs.splice(target, 0, item!);
      return { ...prev, imageSrcs };
    });
  }

  async function ingestFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!list.length) {
      setImageError("Choose image files (JPG, PNG, or WebP).");
      return;
    }
    setUploading(true);
    setImageError(null);
    try {
      const room = MAX_IMAGES - form.imageSrcs.length;
      if (room <= 0) {
        setImageError(`You can add up to ${MAX_IMAGES} images.`);
        return;
      }
      const selected = list.slice(0, room);
      const urls: string[] = [];
      for (const file of selected) {
        urls.push(await fileToProductImageDataUrl(file));
      }
      addImageSrcs(urls);
      if (list.length > room) {
        setImageError(`Only ${MAX_IMAGES} images allowed · added the first ${room}.`);
      }
    } catch {
      setImageError("Could not process one of the images.");
    } finally {
      setUploading(false);
    }
  }

  function addUrlImage() {
    const src = urlDraft.trim();
    if (!src) return;
    if (!(src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/"))) {
      setImageError("Paste a full URL (https://…) or a site path (/products/…).");
      return;
    }
    if (form.imageSrcs.length >= MAX_IMAGES) {
      setImageError(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }
    if (form.imageSrcs.includes(src)) {
      setImageError("That image is already in the list.");
      return;
    }
    setImageError(null);
    addImageSrcs([src]);
    setUrlDraft("");
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (pending || uploading) return;
    void ingestFiles(event.dataTransfer.files);
  }

  function updateColor(index: number, patch: Partial<ColorDraft>) {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.map((color, i) =>
        i === index ? { ...color, ...patch } : color,
      ),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.sizes.length) return;
    if (!form.colors.some((color) => color.name.trim())) return;
    if (!form.imageSrcs.length) {
      setImageError("Add at least one product image.");
      return;
    }

    const payload: PortalProductPayload = {
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      price: Math.round(Number(form.price)),
      compareAtPrice: form.compareAtPrice
        ? Math.round(Number(form.compareAtPrice))
        : null,
      stockQuantity: Math.max(0, Math.round(Number(form.stockQuantity) || 0)),
      category: form.category,
      collection: form.collection,
      fabric: form.fabric.trim() || "See brand",
      fit: form.fit.trim() || "True to size",
      badge: form.badge.trim(),
      featured: form.featured,
      sizes: form.sizes,
      colors: form.colors
        .map((color) => ({
          name: color.name.trim(),
          hex: color.hex.trim() || "#17171A",
        }))
        .filter((color) => color.name),
      details: form.detailsText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
      images: form.imageSrcs.map((src) => ({
        src,
        alt: form.name.trim() || "Product",
      })),
    };

    const ok = await onSubmit(payload);
    if (ok) setForm(EMPTY_FORM);
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-coal/55 backdrop-blur-[2px]"
        onClick={() => {
          if (!pending) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[var(--portal-line)] bg-[var(--portal-card,#fff)] shadow-[0_24px_60px_rgba(17,17,17,0.28)] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--portal-line)] px-5 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="text-lg font-bold tracking-tight">
              Add product
            </h2>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">
              Fill in the full listing · shoppers see this on the product page.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="portal-btn portal-btn--ghost !px-3 !py-1.5 !text-xs"
          >
            Close
          </button>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.1em] text-[var(--portal-muted)] uppercase">
                Basics
              </p>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="portal-input"
                  placeholder="e.g. Dust Season Hoodie"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Tagline</span>
                <input
                  required
                  value={form.tagline}
                  onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))}
                  className="portal-input"
                  placeholder="Short line under the name"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Description</span>
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="portal-input min-h-[6.5rem] resize-y"
                  placeholder="Fabric story, how it wears, what makes it yours…"
                />
              </label>
            </section>

            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.1em] text-[var(--portal-muted)] uppercase">
                Pricing & stock
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">Price (RWF)</span>
                  <input
                    required
                    type="number"
                    min={1}
                    step={1}
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    className="portal-input"
                    placeholder="24800"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">
                    Compare-at (optional)
                  </span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={form.compareAtPrice}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, compareAtPrice: e.target.value }))
                    }
                    className="portal-input"
                    placeholder="Was price"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">
                    Quantity in stock
                  </span>
                  <input
                    required
                    type="number"
                    min={0}
                    step={1}
                    value={form.stockQuantity}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, stockQuantity: e.target.value }))
                    }
                    className="portal-input"
                  />
                </label>
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.1em] text-[var(--portal-muted)] uppercase">
                Catalog
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">Category</span>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        category: e.target.value as CategorySlug,
                      }))
                    }
                    className="portal-input appearance-none"
                  >
                    {categories.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">Collection</span>
                  <select
                    value={form.collection}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        collection: e.target.value as CollectionSlug,
                      }))
                    }
                    className="portal-input appearance-none"
                  >
                    {collections.map((collection) => (
                      <option key={collection.slug} value={collection.slug}>
                        {collection.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">Fabric</span>
                  <input
                    value={form.fabric}
                    onChange={(e) => setForm((p) => ({ ...p, fabric: e.target.value }))}
                    className="portal-input"
                    placeholder="Heavyweight cotton"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">Fit</span>
                  <input
                    value={form.fit}
                    onChange={(e) => setForm((p) => ({ ...p, fit: e.target.value }))}
                    className="portal-input"
                    placeholder="True to size"
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">
                    Badge (optional)
                  </span>
                  <input
                    value={form.badge}
                    onChange={(e) => setForm((p) => ({ ...p, badge: e.target.value }))}
                    className="portal-input"
                    placeholder="New drop"
                  />
                </label>
                <label className="flex items-end gap-2 pb-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, featured: e.target.checked }))
                    }
                    className="h-4 w-4"
                  />
                  Featured
                </label>
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.1em] text-[var(--portal-muted)] uppercase">
                Sizes
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_SIZES.map((size) => {
                  const active = form.sizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`min-w-12 rounded-full px-3 py-2 text-xs font-semibold tracking-[0.08em] uppercase ${
                        active
                          ? "bg-[var(--portal-accent)] text-white"
                          : "bg-[var(--portal-bg)] text-[var(--portal-muted)]"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold tracking-[0.1em] text-[var(--portal-muted)] uppercase">
                  Colours
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      colors: [...p.colors, { name: "", hex: "#17171A" }].slice(0, 8),
                    }))
                  }
                  className="portal-btn portal-btn--ghost !py-1.5 !text-xs"
                >
                  + Add colour
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      setForm((p) => {
                        if (p.colors.some((c) => c.name === preset.name)) return p;
                        return {
                          ...p,
                          colors: [...p.colors, preset].slice(0, 8),
                        };
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--portal-line)] px-2.5 py-1 text-xs"
                    title={`Add ${preset.name}`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-black/10"
                      style={{ background: preset.hex }}
                    />
                    {preset.name}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {form.colors.map((color, index) => (
                  <div key={index} className="grid grid-cols-[1fr_5rem_auto] gap-2">
                    <input
                      required
                      value={color.name}
                      onChange={(e) => updateColor(index, { name: e.target.value })}
                      className="portal-input"
                      placeholder="Colour name"
                    />
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(e) => updateColor(index, { hex: e.target.value })}
                      className="portal-input !h-11 !p-1"
                      aria-label={`Colour ${index + 1} hex`}
                    />
                    <button
                      type="button"
                      disabled={form.colors.length <= 1}
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          colors: p.colors.filter((_, i) => i !== index),
                        }))
                      }
                      className="portal-btn portal-btn--ghost !px-3 !text-xs disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.1em] text-[var(--portal-muted)] uppercase">
                Details
              </p>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">
                  Bullet points (one per line)
                </span>
                <textarea
                  rows={4}
                  value={form.detailsText}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, detailsText: e.target.value }))
                  }
                  className="portal-input min-h-[6rem] resize-y"
                  placeholder={"Corduroy collar\nTwo chest flap pockets\nRe-waxable finish"}
                />
              </label>
            </section>

            <section className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold tracking-[0.1em] text-[var(--portal-muted)] uppercase">
                    Images
                  </p>
                  <p className="mt-1 text-xs text-[var(--portal-muted)]">
                    Upload, paste a URL, or drag files · up to {MAX_IMAGES}. First image is
                    the cover.
                  </p>
                </div>
                <span className="text-xs tabular-nums text-[var(--portal-muted)]">
                  {form.imageSrcs.length}/{MAX_IMAGES}
                </span>
              </div>

              <div
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  if (event.currentTarget.contains(event.relatedTarget as Node)) return;
                  setDragging(false);
                }}
                onDrop={onDrop}
                className={`rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
                  dragging
                    ? "border-[var(--portal-accent)] bg-orange-50/60"
                    : "border-[var(--portal-line)] bg-[var(--portal-bg)]"
                }`}
              >
                <p className="text-sm font-semibold">
                  {dragging ? "Drop images here" : "Drag & drop product photos"}
                </p>
                <p className="mt-1 text-xs text-[var(--portal-muted)]">
                  JPG, PNG, or WebP
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={uploading || form.imageSrcs.length >= MAX_IMAGES}
                    onClick={() => fileInputRef.current?.click()}
                    className="portal-btn portal-btn--accent !py-2 !text-xs disabled:opacity-60"
                  >
                    {uploading ? "Processing…" : "Upload images"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      if (event.target.files?.length) {
                        void ingestFiles(event.target.files);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={urlDraft}
                  onChange={(event) => setUrlDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addUrlImage();
                    }
                  }}
                  className="portal-input flex-1"
                  placeholder="Paste image URL or path · https://… or /photos/…"
                />
                <button
                  type="button"
                  onClick={addUrlImage}
                  disabled={!urlDraft.trim() || form.imageSrcs.length >= MAX_IMAGES}
                  className="portal-btn portal-btn--ink !py-2 !text-xs disabled:opacity-60"
                >
                  Add URL
                </button>
              </div>

              {form.imageSrcs.length ? (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {form.imageSrcs.map((src, index) => (
                    <li
                      key={`${src.slice(0, 48)}-${index}`}
                      className="overflow-hidden rounded-xl border border-[var(--portal-line)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Product ${index + 1}`}
                        className="aspect-[3/4] w-full object-cover"
                      />
                      <div className="space-y-1.5 px-2 py-2">
                        <p className="text-[10px] font-semibold tracking-[0.08em] uppercase">
                          {index === 0 ? "Cover" : `Image ${index + 1}`}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveImage(index, -1)}
                            className="rounded-full bg-[var(--portal-bg)] px-2 py-0.5 text-[10px] font-semibold disabled:opacity-40"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            disabled={index === form.imageSrcs.length - 1}
                            onClick={() => moveImage(index, 1)}
                            className="rounded-full bg-[var(--portal-bg)] px-2 py-0.5 text-[10px] font-semibold disabled:opacity-40"
                          >
                            →
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-[var(--portal-accent)]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {imageError ? (
                <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-[var(--portal-accent)]">
                  {imageError}
                </p>
              ) : null}
            </section>

            {error ? (
              <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-[var(--portal-accent)]">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--portal-line)] px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="portal-btn portal-btn--ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || uploading || !form.sizes.length}
              className="portal-btn portal-btn--accent disabled:opacity-60"
            >
              {pending ? "Publishing…" : "Publish product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
