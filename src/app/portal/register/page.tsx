import { redirect } from "next/navigation";

/** Convenience alias for makers looking for portal signup. */
export default function PortalRegisterRedirect() {
  redirect("/brand-signup");
}
