import type { Metadata } from "next";
import BrandSignupForm from "./brand-signup-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Open a brand portal",
  description: `Apply for a brand portal on ${site.name} · verify email, wait for approval, then sell. ${site.madeIn}.`,
};

export default function BrandSignupPage() {
  return <BrandSignupForm />;
}
