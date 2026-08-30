import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { CultureIcon, type CultureIconName } from "@/components/culture-icons";
import { getVendors } from "@/lib/marketplace";
import { getProductsByVendor } from "@/lib/products";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Brands",
  description: `AFREEKA maker map · shop by city and brand on ${site.name}.`,
};

export default async function BrandsPage() {
  const vendors = await getVendors();
  const counts = await Promise.all(
    vendors.map(async (vendor) => ({
      id: vendor.id,
      count: (await getProductsByVendor(vendor.id)).length,
    })),
  );
  const countMap = Object.fromEntries(counts.map((entry) => [entry.id, entry.count]));

  const byCity = vendors.reduce<Record<string, typeof vendors>>((acc, vendor) => {
    const city = vendor.location.split(",")[0]?.trim() || vendor.location;
    (acc[city] ??= []).push(vendor);
    return acc;
  }, {});

  const cities = Object.keys(byCity).sort((a, b) => a.localeCompare(b));

  return (
    <Container className="py-10 lg:py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">{site.madeIn}</p>
        <h1 className="font-display mt-2 text-5xl tracking-[0.03em] lg:text-6xl">
          Brands
        </h1>
        <p className="mt-4 text-base text-bone-dim">
          An AFREEKA maker map · choose a city, then open a brand floor.
        </p>
        <Link
          href="/brand-signup"
          className="craft-btn mt-6 inline-block bg-rust px-6 py-3 text-xs tracking-[0.2em] text-bone uppercase hover:bg-sand"
        >
          Open your brand portal
        </Link>
      </header>

      <section className="mt-12">
        <p className="eyebrow">Maker map</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {cities.map((city) => (
            <li key={city}>
              <a
                href={`#city-${city.toLowerCase().replace(/\s+/g, "-")}`}
                className="craft-chip craft-chip--idle px-3 py-2 text-xs tracking-[0.12em] uppercase"
              >
                {city}
                <span className="ml-2 text-bone-dim">
                  {byCity[city]?.length ?? 0}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {cities.map((city) => (
        <section
          key={city}
          id={`city-${city.toLowerCase().replace(/\s+/g, "-")}`}
          className="mt-14 scroll-mt-24"
        >
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ash-line pb-4">
            <div>
              <p className="eyebrow">City</p>
              <h2 className="font-display mt-1 text-3xl tracking-[0.04em]">
                {city}
              </h2>
            </div>
            <p className="text-xs tracking-[0.14em] text-bone-dim uppercase">
              {byCity[city]?.length ?? 0}{" "}
              {(byCity[city]?.length ?? 0) === 1 ? "brand" : "brands"}
            </p>
          </div>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(byCity[city] ?? []).map((vendor) => (
              <li key={vendor.id}>
                <Link
                  href={`/brands/${vendor.slug}`}
                  className="craft-panel culture-rise flex h-full flex-col gap-3 bg-bone/90 p-6 transition-colors hover:bg-ash/40"
                >
                  <CultureIcon
                    name={vendor.icon as CultureIconName}
                    className="h-6 w-6 text-rust"
                  />
                  <h3 className="font-display text-2xl tracking-[0.04em]">
                    {vendor.name}
                  </h3>
                  <p className="text-sm text-bone-dim">{vendor.shortBio}</p>
                  <p className="mt-auto pt-4 text-xs tracking-[0.14em] text-bone-dim uppercase">
                    {countMap[vendor.id] ?? 0} products · Open floor →
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Container>
  );
}
