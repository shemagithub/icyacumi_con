import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { CultureIcon, type CultureIconName } from "@/components/culture-icons";
import { MarketplaceProductGrid } from "@/components/marketplace-product-grid";
import {
  getCollection,
  getCollections,
  getProducts,
} from "@/lib/products";
import { site } from "@/lib/site";
import type { CollectionSlug } from "@/lib/types";

const ICONS: Record<string, CultureIconName> = {
  "dust-season": "sun",
  "rodeo-nights": "mask",
  "bone-basics": "textile",
};

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const list = await getCollections();
  return list.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug as CollectionSlug);
  if (!collection) return { title: "Season drop" };
  return {
    title: collection.name,
    description: collection.description,
  };
}

export default async function CollectionPage({ params }: { params: Params }) {
  const { slug } = await params;
  const collection = await getCollection(slug as CollectionSlug);
  if (!collection) notFound();

  const products = await getProducts({
    collection: collection.slug,
    sort: "views",
  });

  return (
    <Container className="py-10 lg:py-14">
      <nav className="text-xs tracking-[0.14em] text-bone-dim uppercase">
        <Link href="/shop" className="hover:text-rust">
          Shop
        </Link>
        <span aria-hidden> / </span>
        <span className="text-coal">{collection.name}</span>
      </nav>

      <header className="mt-8 max-w-2xl">
        <CultureIcon
          name={ICONS[collection.slug] ?? "textile"}
          className="h-8 w-8 text-rust"
        />
        <p className="eyebrow mt-4">{site.madeIn} · Season drop</p>
        <h1 className="font-display mt-2 text-5xl tracking-[0.03em] lg:text-6xl">
          {collection.name}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-bone-dim">
          {collection.description}
        </p>
      </header>

      <div className="mt-12">
        {products.length > 0 ? (
          <MarketplaceProductGrid
            seed={products}
            sort="views"
            priorityCount={4}
          />
        ) : (
          <p className="text-sm text-bone-dim">No pieces in this drop yet.</p>
        )}
      </div>
    </Container>
  );
}
