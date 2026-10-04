import type { Metadata, Viewport } from "next";
import { Figtree, Nunito, Permanent_Marker } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { CartProvider } from "@/components/cart-provider";
import { DeferredAtmosphere } from "@/components/deferred-atmosphere";
import { GoogleAnalytics } from "@/components/google-analytics";
import { ImigongoBackdrop } from "@/components/imigongo-backdrop";
import { JsonLd } from "@/components/json-ld";
import { MobileKeyboardViewport } from "@/components/mobile-keyboard-viewport";
import { MobileQuickNav } from "@/components/mobile-quick-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteSettingsProvider } from "@/components/site-settings-provider";
import { StoreFontLinks } from "@/components/store-font-links";
import { SiteThemeApplier } from "@/components/site-theme-applier";
import { SITE_OG_LOCALE, siteLocaleTag } from "@/lib/intl";
import {
  organizationJsonLd,
  resolveMediaUrl,
  websiteJsonLd,
} from "@/lib/seo";
import { getDisplayFont } from "@/lib/site-fonts";
import { site } from "@/lib/site";
import { fetchPublicSiteSettings } from "@/lib/site-settings";
import { themeCssVars } from "@/lib/site-theme";
import "./globals.css";

/** Casual rounded type for brand lockup + headings · neat, friendly */
const display = Nunito({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  preload: true,
});

/** Clean readable body · warmer than default system stacks */
const sans = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  preload: true,
});

/** Hand-drawn marker style for navbar labels (KAPOW energy). */
const nav = Permanent_Marker({
  variable: "--font-marker",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const live = await fetchPublicSiteSettings();
  const logoUrl =
    resolveMediaUrl(live.logoUrl) ?? `${site.url}${site.logo.src}`;
  const titleDefault = `${live.companyName} · Shop, events & ads`;
  const description = live.positioning;

  return {
    metadataBase: new URL(site.url),
    title: {
      default: titleDefault,
      template: `%s · ${live.companyName}`,
    },
    description,
    applicationName: live.companyName,
    authors: [{ name: live.companyName, url: site.url }],
    creator: live.companyName,
    publisher: live.companyName,
    category: "shopping",
    keywords: [
      live.companyName,
      "multi-vendor marketplace",
      "African fashion",
      "Rwanda fashion",
      "event tickets",
      "streetwear",
      "Made in Africa",
      live.madeIn,
      "shop online",
    ],
    alternates: { canonical: "/" },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: SITE_OG_LOCALE,
      siteName: live.companyName,
      title: `${live.companyName} · ${live.tagline}`,
      description,
      url: site.url,
      images: [
        {
          url: logoUrl,
          width: site.logo.width,
          height: site.logo.height,
          alt: live.logoAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${live.companyName} · ${live.tagline}`,
      description,
      images: [logoUrl],
    },
    icons: {
      icon: [{ url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" }],
      apple: [{ url: "/brand/logo.png" }],
    },
    manifest: "/manifest.webmanifest",
    other: {
      "geo.region": "RW",
      language: siteLocaleTag(),
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const live = await fetchPublicSiteSettings();
  const fontVars = themeCssVars(live.theme);
  const sameAs = live.social.map((link) => link.href).filter(Boolean);

  return (
    <html
      lang={siteLocaleTag().slice(0, 2)}
      translate="no"
      className={`${display.variable} ${sans.variable} ${nav.variable} h-full`}
      style={{
        ["--store-nav-font" as string]: fontVars["--store-nav-font"],
        ["--store-brand-font" as string]: fontVars["--store-brand-font"],
      }}
      data-nav-vibe={getDisplayFont(live.theme.navFont).vibe}
      data-brand-vibe={getDisplayFont(live.theme.brandFont).vibe}
      suppressHydrationWarning
    >
      <body
        className={`${sans.className} relative flex min-h-full flex-col`}
        suppressHydrationWarning
      >
        <JsonLd
          data={[
            organizationJsonLd({
              name: live.companyName,
              description: live.positioning,
              email: live.email,
              phone: live.phone,
              logoUrl: live.logoUrl,
              sameAs,
            }),
            websiteJsonLd({
              name: live.companyName,
              description: live.positioning,
            }),
          ]}
        />
        <GoogleAnalytics
          measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
        />
        <StoreFontLinks fontIds={[live.theme.navFont, live.theme.brandFont]} />
        <MobileKeyboardViewport />
        <SiteSettingsProvider initial={live}>
          <SiteThemeApplier />
          <ImigongoBackdrop />
          <DeferredAtmosphere />
          <AuthProvider>
            <CartProvider>
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-rust focus:px-4 focus:py-2 focus:text-bone"
              >
                Skip to content
              </a>
              <div className="relative z-10 flex min-h-full flex-1 flex-col">
                <SiteHeader />
                <main id="main" className="flex-1">
                  {children}
                </main>
                <SiteFooter />
                <MobileQuickNav />
              </div>
            </CartProvider>
          </AuthProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
