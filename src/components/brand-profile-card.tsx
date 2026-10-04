import Link from "next/link";
import { CultureIcon, type CultureIconName } from "@/components/culture-icons";
import { SocialIcons, type SocialLink } from "@/components/social-icons";
import type { Vendor } from "@/lib/types";

export function vendorSocialLinks(vendor: Pick<
  Vendor,
  "instagram" | "tiktok" | "facebook" | "twitter" | "youtube" | "website"
>): SocialLink[] {
  const candidates = [
    { href: vendor.instagram, label: "Instagram" },
    { href: vendor.tiktok, label: "TikTok" },
    { href: vendor.facebook, label: "Facebook" },
    { href: vendor.twitter, label: "X" },
    { href: vendor.youtube, label: "YouTube" },
    { href: vendor.website, label: "Website" },
  ] as const;

  const links: SocialLink[] = [];
  for (const item of candidates) {
    const href = item.href?.trim();
    if (href) links.push({ href, label: item.label });
  }
  return links;
}

/**
 * Public brand profile · bio, location, and socials from portal Settings.
 */
export function BrandProfileCard({
  vendor,
  productCount,
  compact = false,
  showShopCta = true,
}: {
  vendor: Vendor;
  productCount?: number;
  /** Compact layout for product detail sidebar */
  compact?: boolean;
  /** Hide shop CTAs when already on the brand page */
  showShopCta?: boolean;
}) {
  const socials = vendorSocialLinks(vendor);
  const brandHref = `/brands/${vendor.slug}`;
  const icon = (vendor.icon || "hut") as CultureIconName;

  return (
    <aside
      id="brand-profile"
      className={
        compact
          ? "mt-8 overflow-hidden rounded-xl border border-ash-line bg-bone"
          : "overflow-hidden rounded-xl border border-ash-line bg-bone"
      }
    >
      <div className="border-b border-ash-line px-5 py-4">
        <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-bone-dim uppercase">
          Brand profile
        </p>
        <div className="mt-3 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ash-line bg-ash/40">
            <CultureIcon name={icon} className="h-6 w-6 text-rust" />
          </div>
          <div className="min-w-0">
            <h2
              className={
                compact
                  ? "font-display text-2xl tracking-[0.04em] text-coal"
                  : "font-display text-3xl tracking-[0.04em] text-coal lg:text-4xl"
              }
            >
              {vendor.name}
            </h2>
            {vendor.location ? (
              <p className="mt-1 text-sm text-bone-dim">{vendor.location}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        {vendor.shortBio ? (
          <p className="text-sm leading-relaxed text-bone-dim">{vendor.shortBio}</p>
        ) : (
          <p className="text-sm text-bone-dim">
            This brand has not added a public bio yet.
          </p>
        )}

        {vendor.contactEmail || vendor.contactPhone ? (
          <div>
            <p className="mb-2 text-[0.65rem] font-semibold tracking-[0.16em] text-bone-dim uppercase">
              Contact
            </p>
            <ul className="space-y-1.5 text-sm text-coal">
              {vendor.contactEmail ? (
                <li>
                  <a
                    href={`mailto:${vendor.contactEmail}`}
                    className="underline-offset-2 hover:text-rust hover:underline"
                  >
                    {vendor.contactEmail}
                  </a>
                </li>
              ) : null}
              {vendor.contactPhone ? (
                <li>
                  <a
                    href={`tel:${vendor.contactPhone.replace(/\s+/g, "")}`}
                    className="underline-offset-2 hover:text-rust hover:underline"
                  >
                    {vendor.contactPhone}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        {typeof productCount === "number" ? (
          <p className="text-sm text-bone-dim">
            <span className="font-semibold tabular-nums text-coal">{productCount}</span>{" "}
            {productCount === 1 ? "product" : "products"} in the shop
          </p>
        ) : null}

        {socials.length > 0 ? (
          <div>
            <p className="mb-2 text-[0.65rem] font-semibold tracking-[0.16em] text-bone-dim uppercase">
              Connect
            </p>
            <SocialIcons links={socials} size="sm" />
          </div>
        ) : null}

        {showShopCta ? (
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href={brandHref}
              className="inline-flex max-w-full rounded-full bg-rust px-5 py-3 text-xs font-bold tracking-[0.16em] text-bone uppercase transition-colors hover:bg-sand"
            >
              <span className="truncate">See all {vendor.name} products</span>
            </Link>
            <Link
              href={`${brandHref}?tab=sale`}
              className="inline-flex items-center text-xs tracking-[0.14em] text-rust uppercase underline-offset-4 hover:underline"
            >
              Brand sale →
            </Link>
            <Link
              href={brandHref}
              className="inline-flex items-center text-xs tracking-[0.14em] text-bone-dim uppercase underline-offset-4 hover:text-rust hover:underline"
            >
              Full brand page →
            </Link>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
