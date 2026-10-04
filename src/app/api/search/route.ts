import { searchCatalog } from "@/lib/site-search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") ?? "")
    .trim()
    .slice(0, 80);

  const result = await searchCatalog(q, {
    products: 6,
    brands: 5,
    events: 5,
    ads: 4,
  });

  return Response.json(result);
}
