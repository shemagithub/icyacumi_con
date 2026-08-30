"use client";

import { useMemo } from "react";
import { ProductGrid } from "@/components/product-grid";
import { vendors as seedVendors } from "@/data/marketplace";
import type { Product } from "@/lib/types";

function withBrandMeta(product: Product): Product {
  if (product.brandSlug && product.brandName) return product;
  const vendor = seedVendors.find((entry) => entry.id === product.vendorId);
  if (!vendor) return product;
  return {
    ...product,
    brandName: product.brandName ?? vendor.name,
    brandSlug: product.brandSlug ?? vendor.slug,
    brandLocation: product.brandLocation ?? vendor.location,
  };
}

export function MarketplaceProductGrid({
  seed,
  sort = "views",
  limit,
  priorityCount = 0,
  vendorId,
}: {
  seed: Product[];
  sort?: "views" | "featured" | "none";
  limit?: number;
  priorityCount?: number;
  vendorId?: string;
}) {
  const products = useMemo(() => {
    const list = seed
      .filter((product) => !vendorId || product.vendorId === vendorId)
      .map(withBrandMeta);
    if (sort !== "none") {
      list.sort((a, b) => {
        if (sort === "featured") {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
        }
        return b.views - a.views || a.name.localeCompare(b.name);
      });
    }
    return typeof limit === "number" ? list.slice(0, limit) : list;
  }, [seed, sort, limit, vendorId]);

  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-bone-dim">No products yet.</p>
    );
  }

  return <ProductGrid products={products} priorityCount={priorityCount} />;
}
