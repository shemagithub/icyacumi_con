import { redirect } from "next/navigation";

/** Old “MVP” route · that label meant Minimum Viable Product, not a page. */
export default function MvpRedirectPage() {
  redirect("/shop");
}
