import { prisma } from "./db.js";

export const LEGAL_IDS = ["terms", "privacy"] as const;
export type LegalId = (typeof LEGAL_IDS)[number];

export function isLegalId(value: string): value is LegalId {
  return (LEGAL_IDS as readonly string[]).includes(value);
}

const DEFAULTS: Record<
  LegalId,
  { title: string; body: string }
> = {
  terms: {
    title: "Terms & Conditions",
    body: `Welcome to BONE KOBOYI.

By creating an account or using our marketplace (shop, events, ads, and brand portal), you agree to these Terms & Conditions.

1. Accounts
You must provide accurate information. You are responsible for keeping your login secure. Client accounts are for shopping; brand portal accounts are for sellers.

2. Orders & payments
Prices are shown in RWF unless stated otherwise. Orders are confirmed after successful payment. Delivery timelines are estimates and may vary by location and brand.

3. Brands & listings
Brand owners are responsible for the accuracy of their products, events, and ads. BONE KOBOYI may remove listings that violate marketplace rules or local law.

4. Acceptable use
Do not misuse the platform, attempt unauthorized access, or post harmful content.

5. Changes
We may update these terms. Continued use after updates means you accept the revised terms.

Contact fit@bonekoboyi.com with questions.`,
  },
  privacy: {
    title: "Privacy Policy",
    body: `BONE KOBOYI respects your privacy.

1. What we collect
Account details (name, email, phone, address), order history, and technical data needed to run the site (cookies/session).

2. How we use it
To create your account, process orders, send verification and order emails, improve the marketplace, and support brands with fulfillment notices.

3. Sharing
We share order details with the brands selling the items you buy. We do not sell your personal data. Payment processors may receive payment details when you check out.

4. Security
We use industry-standard practices to protect accounts. No method of transmission is 100% secure.

5. Your choices
You can update profile details in your account. Contact us to request account deletion where applicable.

6. Updates
We may revise this policy; the latest version is always on this page.

Contact fit@bonekoboyi.com for privacy requests.`,
  },
};

export async function ensureLegalPages() {
  for (const id of LEGAL_IDS) {
    const defaults = DEFAULTS[id];
    await prisma.legalPage.upsert({
      where: { id },
      update: {},
      create: {
        id,
        title: defaults.title,
        body: defaults.body,
      },
    });
  }
}

export async function getLegalPage(id: LegalId) {
  await ensureLegalPages();
  const page = await prisma.legalPage.findUnique({ where: { id } });
  if (!page) {
    const defaults = DEFAULTS[id];
    return {
      id,
      title: defaults.title,
      body: defaults.body,
      updatedAt: new Date().toISOString(),
    };
  }
  return {
    id: page.id,
    title: page.title,
    body: page.body,
    updatedAt: page.updatedAt.toISOString(),
  };
}

export async function listLegalPages() {
  await ensureLegalPages();
  const pages = await prisma.legalPage.findMany({
    orderBy: { id: "asc" },
  });
  return pages.map((page) => ({
    id: page.id,
    title: page.title,
    body: page.body,
    updatedAt: page.updatedAt.toISOString(),
  }));
}
