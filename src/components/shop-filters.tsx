"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { shopHref, hasActiveFilters } from "@/lib/shop-url";
import type {
  Category,
  ColorOption,
  ProductFilters,
  Size,
  SortKey,
} from "@/lib/types";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Our Picks" },
  { key: "newest", label: "Newest first" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "sale-desc", label: "Sale: high to low" },
];

/** Compact shop filters · a few selects, not long chip walls. */
export function ShopFilters({
  filters,
  categories,
  sizes,
  colors,
  resultCount,
}: {
  filters: ProductFilters;
  categories: Category[];
  sizes: Size[];
  colors: ColorOption[];
  resultCount: number;
}) {
  const router = useRouter();
  const activeSort = filters.sort ?? "featured";

  function go(patch: Partial<ProductFilters>) {
    router.push(shopHref(filters, patch));
  }

  return (
    <div className="border-y border-ash-line py-4">
      <div className="flex flex-wrap items-end gap-3 sm:gap-4">
        <FilterSelect
          label="Category"
          value={filters.category ?? ""}
          onChange={(value) => go({ category: value || undefined })}
        >
          <option value="">All</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Size"
          value={filters.size ?? ""}
          onChange={(value) =>
            go({ size: (value || undefined) as Size | undefined })
          }
        >
          <option value="">All</option>
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Colour"
          value={filters.color ?? ""}
          onChange={(value) => go({ color: value || undefined })}
        >
          <option value="">All</option>
          {colors.map((color) => (
            <option key={color.name} value={color.name}>
              {color.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Sort by"
          value={activeSort}
          onChange={(value) => go({ sort: value as SortKey })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </FilterSelect>

        <div className="ml-auto flex min-w-[8rem] flex-col justify-end gap-1 pb-0.5">
          <p className="text-xs tracking-[0.14em] text-bone-dim uppercase">
            {resultCount} {resultCount === 1 ? "piece" : "pieces"}
          </p>
          {hasActiveFilters(filters) || activeSort !== "featured" ? (
            <Link
              href="/shop"
              className="text-xs tracking-[0.14em] text-rust uppercase underline underline-offset-4 hover:text-sand"
            >
              Clear filters
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-[7.5rem] flex-1 sm:max-w-[14rem]">
      <span className="eyebrow mb-1.5 block">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-input w-full appearance-none py-2.5 pr-8 text-xs tracking-[0.04em]"
      >
        {children}
      </select>
    </label>
  );
}
