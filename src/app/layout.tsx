import type { Metadata } from "next";
import { Figtree, Nunito, Permanent_Marker } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { CartProvider } from "@/components/cart-provider";
import { ImigongoBackdrop } from "@/components/imigongo-backdrop";
import { MobileQuickNav } from "@/components/mobile-quick-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteSettingsProvider } from "@/components/site-settings-provider";
import { site } from "@/lib/site";
import { fetchPublicSiteSettings } from "@/lib/site-settings";
import "./globals.css";

/** Casual rounded type for brand lockup + headings · neat, friendly */
const display = Nunito({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

/** Clean readable body · warmer than default system stacks */
const sans = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Hand-drawn marker style for navbar labels (KAPOW energy). */
const nav = Permanent_Marker({
  variable: "--font-nav",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const live = await fetchPublicSiteSettings();
  return {
    metadataBase: new URL(site.url),
    title: {
      default: `${live.companyName} · Shop, events & ads`,
      template: `%s · ${live.companyName}`,
    },
    description: live.positioning,
    keywords: [
      live.companyName,
      "multi-vendor marketplace",
      "African fashion",
      "event tickets",
      live.madeIn,
    ],
    openGraph: {
      type: "website",
      siteName: live.companyName,
      title: `${live.companyName} · ${live.positioning}`,
      description: live.positioning,
      url: site.url,
      images: [
        {
          url: live.logoUrl.startsWith("data:") ? site.logo.src : live.logoUrl,
          width: site.logo.width,
          height: site.logo.height,
          alt: live.logoAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${live.companyName} · ${live.positioning}`,
      description: live.positioning,
      images: [live.logoUrl.startsWith("data:") ? site.logo.src : live.logoUrl],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const live = await fetchPublicSiteSettings();

  return (
    <html
      lang="en"
      translate="no"
      className={`${display.variable} ${sans.variable} ${nav.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className={`${sans.className} relative flex min-h-full flex-col`}
        suppressHydrationWarning
      >
        <ImigongoBackdrop />
        <SiteSettingsProvider initial={live}>
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
                <main id="main" className="flex-1 pb-16 lg:pb-0">
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
