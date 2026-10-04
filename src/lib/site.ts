import type { CultureIconName } from "@/components/culture-icons";

/** Short marketplace positioning · keep copy lean. */
export const POSITIONING =
  "Shop products, book event tickets, and run ads · MADE IN AFREEKA, all in one place.";

export const site = {
  name: "ICYACUMI",
  shortName: "ICY",
  displayName: "ICYACUMI",
  tagline: "Shop. Events. Ads.",
  madeIn: "MADE IN AFREEKA",
  positioning: POSITIONING,
  description: `${POSITIONING}`,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  currency: "RWF",
  freeShippingThreshold: 50000,
  shippingRate: 2500,
  email: "fit@icyacumi.com",
  phone: null as string | null,
  logo: {
    src: "/brand/logo.png",
    alt: "ICYACUMI / MADE IN AFREEKA mark",
    width: 530,
    height: 564,
  },
  nav: [
    { href: "/", label: "Home", icon: "hut" as CultureIconName },
    { href: "/shop", label: "Shop", icon: "cloth" as CultureIconName },
    { href: "/brands", label: "Brands", icon: "necklace" as CultureIconName },
    { href: "/events", label: "Events", icon: "drum" as CultureIconName },
    { href: "/ads", label: "Ads", icon: "mask" as CultureIconName },
  ],
  footer: {
    shop: [
      { href: "/shop", label: "Shop", icon: "cloth" as CultureIconName },
      { href: "/shop/sale", label: "Sale", icon: "sun" as CultureIconName },
      { href: "/brands", label: "Brands", icon: "necklace" as CultureIconName },
      { href: "/events", label: "Events", icon: "drum" as CultureIconName },
      { href: "/ads", label: "Ads", icon: "mask" as CultureIconName },
      { href: "/collections/dust-season", label: "Season drops", icon: "sun" as CultureIconName },
      { href: "/heritage", label: "Heritage", icon: "mask" as CultureIconName },
      { href: "/art", label: "Art", icon: "textile" as CultureIconName },
    ],
    help: [
      { href: "/search", label: "Search", icon: "search" as CultureIconName },
      { href: "/track", label: "Track order", icon: "spiral" as CultureIconName },
      { href: "/contact", label: "Contact", icon: "drum" as CultureIconName },
      { href: "/about", label: "About", icon: "hut" as CultureIconName },
      { href: "/login", label: "Log in", icon: "person" as CultureIconName },
      { href: "/register", label: "Create account", icon: "spiral" as CultureIconName },
      { href: "/brand-signup", label: "Become a brand", icon: "cloth" as CultureIconName },
      { href: "/terms", label: "Terms", icon: "shield" as CultureIconName },
      { href: "/privacy", label: "Privacy", icon: "spiral" as CultureIconName },
    ],
  },
  social: [
    { href: "https://instagram.com", label: "Instagram" },
    { href: "https://tiktok.com", label: "TikTok" },
  ],
  categoryIcons: {
    outerwear: "shield",
    fleece: "cloth",
    tees: "cloth",
    shirts: "textile",
    denim: "drum",
    pants: "spiral",
    accessories: "necklace",
  } as Record<string, CultureIconName>,
} as const;
