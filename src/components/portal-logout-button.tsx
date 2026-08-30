"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export function PortalLogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <button
      type="button"
      className="underline hover:text-rust"
      onClick={async () => {
        await logout();
        router.push("/login?next=/portal");
        router.refresh();
      }}
    >
      Log out
    </button>
  );
}
