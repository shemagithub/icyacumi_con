import { getAds, getEvents, getVendors } from "@/lib/marketplace";
import { getProducts } from "@/lib/products";

function matches(query: string, ...fields: Array<string | null | undefined>) {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);
  if (!tokens.length) return false;
  const hay = fields
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return tokens.every((token) => hay.includes(token));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") ?? "")
    .trim()
    .slice(0, 80);

  if (q.length < 1) {
    return Response.json({
      query: q,
      products: [],
      brands: [],
      events: [],
      ads: [],
    });
  }

  const [productsAll, brandsAll, eventsAll, adsAll] = await Promise.all([
    getProducts({ sort: "views" }),
    getVendors(),
    getEvents(),
    getAds(),
  ]);

  const products = productsAll
    .filter((product) =>
      matches(
        q,
        product.name,
        product.tagline,
        product.description,
        product.category,
        product.fabric,
        product.brandName,
        product.brandLocation,
        product.brandSlug,
      ),
    )
    .slice(0, 6);

  const brands = brandsAll
    .filter((brand) => matches(q, brand.name, brand.shortBio, brand.location, brand.slug))
    .slice(0, 5);

  const events = eventsAll
    .filter((event) =>
      matches(q, event.title, event.summary, event.venue, event.city, event.slug),
    )
    .slice(0, 5);

  const ads = adsAll
    .filter((ad) => matches(q, ad.title, ad.summary, ad.type, ad.brand, ad.slug))
    .slice(0, 4);

  return Response.json({ query: q, products, brands, events, ads });
}
