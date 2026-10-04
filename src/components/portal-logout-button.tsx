"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { CultureIcon } from "@/components/culture-icons";

export function PortalLogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <button
      type="button"
      className="inline-flex min-h-11 min-w-11 items-center justify-center text-bone-dim transition-colors hover:text-rust"
      aria-label="Log out"
      title="Log out"
      onClick={async () => {
        await logout();
        router.push("/login?next=/portal");
        router.refresh();
      }}
    >
      <CultureIcon name="logout" className="h-5 w-5" />
    </button>
  );
}
