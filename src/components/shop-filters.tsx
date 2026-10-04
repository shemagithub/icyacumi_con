"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { shopHref, hasActiveFilters } from "@/lib/shop-url";
import type {
  Category,
  CategorySlug,
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

/** Shop filters · one horizontal row (scrolls on phones), grid on wide screens. */
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
  const categoryName = categories.find((item) => item.slug === filters.category)?.name;

  function go(patch: Partial<ProductFilters>) {
    router.push(shopHref(filters, patch));
  }

  const pills: { key: string; label: string; clear: Partial<ProductFilters> }[] = [];
  if (filters.category) {
    pills.push({
      key: "category",
      label: categoryName ?? filters.category,
      clear: { category: undefined },
    });
  }
  if (filters.size) {
    pills.push({ key: "size", label: `Size ${filters.size}`, clear: { size: undefined } });
  }
  if (filters.color) {
    pills.push({ key: "color", label: filters.color, clear: { color: undefined } });
  }

  return (
    <div className="shop-filters">
      {pills.length > 0 ? (
        <div className="shop-filters__pills">
          {pills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              className="shop-filters__pill"
              onClick={() => go(pill.clear)}
            >
              {pill.label}
              <span aria-hidden>×</span>
            </button>
          ))}
          <Link
            href={shopHref(filters, {
              category: undefined,
              size: undefined,
              color: undefined,
            })}
            className="shop-filters__clear"
          >
            Clear
          </Link>
        </div>
      ) : null}

      <div className="shop-filters__grid">
        <FilterSelect
          label="Category"
          value={filters.category ?? ""}
          onChange={(value) =>
            go({ category: (value || undefined) as CategorySlug | undefined })
          }
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
      </div>

      <div className="shop-filters__meta">
        <p>
          {resultCount} {resultCount === 1 ? "piece" : "pieces"}
        </p>
        {hasActiveFilters(filters) || activeSort !== "featured" ? (
          <Link href="/shop">Clear filters</Link>
        ) : null}
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
    <label className="shop-filter-field">
      <span className="eyebrow">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-input shop-filter-field__select"
      >
        {children}
      </select>
    </label>
  );
}
