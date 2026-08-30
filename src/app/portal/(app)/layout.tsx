import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { readPortalSession } from "@/lib/portal-auth";

export default async function PortalAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readPortalSession();
  if (!session) redirect("/login?next=/portal");

  return <PortalShell session={session}>{children}</PortalShell>;
}
