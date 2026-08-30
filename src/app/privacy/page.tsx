import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} handles your data.`,
};

export default function PrivacyPage() {
  return <LegalDocument id="privacy" />;
}
