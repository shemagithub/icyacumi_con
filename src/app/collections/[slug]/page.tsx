import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { CultureIcon, type CultureIconName } from "@/components/culture-icons";
import { JsonLd } from "@/components/json-ld";
import { MarketplaceProductGrid } from "@/components/marketplace-product-grid";
import { ShopDropNav } from "@/components/shop-drop-nav";
import {
  getCollection,
  getCollections,
  getProducts,
} from "@/lib/products";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  collectionPageJsonLd,
} from "@/lib/seo";
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
  return buildPageMetadata({
    title: collection.name,
    description: `${collection.description} · Season drop on ${site.name}`,
    path: `/collections/${collection.slug}`,
    keywords: [
      collection.name,
      "season drop",
      "collection",
      site.name,
      site.madeIn,
    ],
  });
}

export default async function CollectionPage({ params }: { params: Params }) {
  const { slug } = await params;
  const collection = await getCollection(slug as CollectionSlug);
  if (!collection) notFound();

  const [products, collections] = await Promise.all([
    getProducts({
      collection: collection.slug,
      sort: "views",
    }),
    getCollections(),
  ]);

  return (
    <Container className="py-10 lg:py-14">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
            { name: collection.name, path: `/collections/${collection.slug}` },
          ]),
          collectionPageJsonLd({
            name: collection.name,
            description: collection.description,
            path: `/collections/${collection.slug}`,
            items: products.slice(0, 24).map((product) => ({
              name: product.name,
              path: `/shop/${product.slug}`,
            })),
          }),
        ]}
      />

      <nav className="text-xs tracking-[0.14em] text-bone-dim uppercase">
        <Link href="/shop" className="hover:text-rust">
          Shop
        </Link>
        <span aria-hidden> / </span>
        <span className="text-coal">{collection.name}</span>
      </nav>

      <header className="mx-auto mt-8 max-w-2xl text-center md:mx-0 md:text-left">
        <CultureIcon
          name={ICONS[collection.slug] ?? "textile"}
          className="mx-auto h-8 w-8 text-rust md:mx-0"
        />
        <p className="eyebrow mt-4">{site.madeIn} · Season drop</p>
        <h1 className="font-display mt-2 text-5xl tracking-[0.03em] lg:text-6xl">
          {collection.name}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-bone-dim">
          {collection.description}
        </p>
      </header>

      <div className="mt-10">
        <ShopDropNav collections={collections} active={collection.slug} />
      </div>

      <div className="mt-10">
        <MarketplaceProductGrid
          seed={products}
          sort="views"
          limit={24}
          priorityCount={4}
        />
      </div>
    </Container>
  );
}
