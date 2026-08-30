import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { readAdminSession } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readAdminSession();
  if (!session) redirect("/login?next=/admin");
  return <AdminShell session={session}>{children}</AdminShell>;
}
