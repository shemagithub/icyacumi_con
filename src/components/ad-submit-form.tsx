"use client";

import Link from "next/link";
import { CultureIcon } from "@/components/culture-icons";
import { useAuth } from "@/components/auth-provider";

/**
 * Public ads are created by brands in the portal · not a localStorage demo.
 */
export function AdSubmitForm() {
  const { user } = useAuth();
  const isBrand = user?.type === "brand";

  return (
    <div className="craft-panel bg-ash/50 px-6 py-10 text-center sm:px-8">
      <CultureIcon name="mask" className="mx-auto h-8 w-8 text-rust" />
      <p className="font-display mt-4 text-2xl tracking-[0.06em]">
        Ads run from the brand portal
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-bone-dim">
        Publish photo, visual, or video creatives after you open a brand account.
        Live ads appear on this board for everyone · not just this device.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {isBrand ? (
          <Link
            href="/portal/ads"
            className="craft-btn bg-rust px-6 py-3 text-xs tracking-[0.18em] text-bone uppercase"
          >
            Open portal ads
          </Link>
        ) : (
          <>
            <Link
              href="/brand-signup"
              className="craft-btn bg-rust px-6 py-3 text-xs tracking-[0.18em] text-bone uppercase"
            >
              Create brand account
            </Link>
            <Link
              href="/login?next=/portal/ads"
              className="craft-btn-ghost bg-bone px-6 py-3 text-xs tracking-[0.18em] uppercase"
            >
              Brand login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
