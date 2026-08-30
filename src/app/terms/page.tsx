import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `Terms of use for ${site.name}.`,
};

export default function TermsPage() {
  return <LegalDocument id="terms" />;
}
