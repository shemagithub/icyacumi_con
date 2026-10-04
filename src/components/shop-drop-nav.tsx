import Link from "next/link";
import { CultureIcon, type CultureIconName } from "@/components/culture-icons";
import type { Collection, CollectionSlug } from "@/lib/types";

const DROP_ICONS: Record<string, CultureIconName> = {
  "dust-season": "sun",
  "rodeo-nights": "mask",
  "bone-basics": "textile",
};

/** Season-drop chips · Shop / Sale / each collection. */
export function ShopDropNav({
  collections,
  active,
  showSale = true,
  showEyebrow = true,
}: {
  collections: Collection[];
  /** Active collection slug, or null/undefined when on all-shop. */
  active?: CollectionSlug | string | null;
  showSale?: boolean;
  showEyebrow?: boolean;
}) {
  const onAll = !active;

  return (
    <nav aria-label="Season drops">
      {showEyebrow ? <p className="eyebrow mb-3">Season drops</p> : null}
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href="/shop"
            className={`craft-chip px-3 py-2 text-xs tracking-[0.12em] uppercase ${
              onAll ? "craft-chip--active" : "craft-chip--idle"
            }`}
            aria-current={onAll ? "page" : undefined}
          >
            All
          </Link>
        </li>
        {showSale ? (
          <li>
            <Link
              href="/shop/sale"
              className="craft-chip craft-chip--idle px-3 py-2 text-xs tracking-[0.12em] uppercase"
            >
              Sale
            </Link>
          </li>
        ) : null}
        {collections.map((collection) => {
          const isActive = active === collection.slug;
          return (
            <li key={collection.slug}>
              <Link
                href={`/collections/${collection.slug}`}
                className={`craft-chip inline-flex items-center gap-2 px-3 py-2 text-xs tracking-[0.12em] uppercase ${
                  isActive ? "craft-chip--active" : "craft-chip--idle"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <CultureIcon
                  name={DROP_ICONS[collection.slug] ?? "textile"}
                  className={`h-3.5 w-3.5 ${isActive ? "text-paint-yellow" : "text-rust"}`}
                />
                {collection.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
