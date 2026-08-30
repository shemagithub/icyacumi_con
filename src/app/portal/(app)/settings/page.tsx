"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";

type BrandSettings = {
  id: string;
  name: string;
  slug: string;
  shortBio: string;
  location: string;
  contactEmail: string | null;
  contactPhone: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  twitter: string | null;
  youtube: string | null;
  website: string | null;
  payoutProvider: string | null;
  payoutAccount: string | null;
};

export default function PortalSettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [brand, setBrand] = useState<BrandSettings | null>(null);
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/portal/settings", { credentials: "include" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Failed to load settings");
      return;
    }
    setBrand(data.brand);
    setNotificationEmails(
      Array.isArray(data.notificationEmails) ? data.notificationEmails : [],
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/portal/settings", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shortBio: form.get("shortBio"),
        location: form.get("location"),
        contactEmail: form.get("contactEmail"),
        contactPhone: form.get("contactPhone"),
        instagram: form.get("instagram"),
        tiktok: form.get("tiktok"),
        facebook: form.get("facebook"),
        twitter: form.get("twitter"),
        youtube: form.get("youtube"),
        website: form.get("website"),
        payoutProvider: form.get("payoutProvider"),
        payoutAccount: form.get("payoutAccount"),
      }),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Could not save");
      return;
    }
    setBrand(data.brand);
    setMessage("Brand profile and socials saved.");
  }

  async function onChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordPending(true);
    setPasswordError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const nextPassword = String(form.get("nextPassword") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (nextPassword !== confirm) {
      setPasswordError("New passwords do not match.");
      setPasswordPending(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.get("currentPassword"),
          nextPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setPasswordError(data.error ?? "Could not update password.");
        return;
      }
      await logout();
      router.push(data.redirectTo ?? "/login?changed=1");
      router.refresh();
    } catch {
      setPasswordError("Could not reach the server.");
    } finally {
      setPasswordPending(false);
    }
  }

  if (!brand) {
    return <p className="text-sm text-[var(--portal-muted)]">{error ?? "Loading settings…"}</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Brand settings</h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Update your public profile, contact details, social links, and payout destination.
          </p>
        </div>
        <Link
          href={`/brands/${brand.slug}`}
          className="portal-btn portal-btn--ghost !py-2 !text-xs"
        >
          View public page
        </Link>
      </header>

      {message ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-[var(--portal-accent)]">
          {error}
        </p>
      ) : null}

      <section className="portal-card space-y-3 p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Email notifications</h2>
        <p className="text-xs text-[var(--portal-muted)]">
          Sale alerts, order updates, sold-out warnings, and payout messages go to your
          brand login email(s). Keep this inbox monitored.
        </p>
        <ul className="space-y-1.5">
          {(notificationEmails.length ? notificationEmails : ["-"]).map((email) => (
            <li
              key={email}
              className="rounded-xl bg-[var(--portal-bg)] px-3 py-2 text-sm font-medium"
            >
              {email}
            </li>
          ))}
        </ul>
        <p className="text-xs text-[var(--portal-muted)]">
          You are emailed when someone buys your products or tickets, when order status
          changes, when stock hits zero, and when payout status updates.
        </p>
      </section>

      <form onSubmit={onSave} className="grid gap-4 lg:grid-cols-2">
        <section className="portal-card space-y-3 p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Public profile</h2>
          <p className="text-xs text-[var(--portal-muted)]">
            Shown on product pages and your public brand shop. {brand.name}
          </p>
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">Location</span>
            <input
              name="location"
              defaultValue={brand.location}
              className="portal-input"
              placeholder="Kigali, Rwanda"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">Short bio</span>
            <textarea
              name="shortBio"
              defaultValue={brand.shortBio}
              rows={4}
              className="portal-input min-h-[6rem] resize-y"
              placeholder="Tell shoppers about your brand"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              Public contact email
            </span>
            <input
              name="contactEmail"
              type="email"
              defaultValue={brand.contactEmail ?? ""}
              className="portal-input"
              placeholder="hello@yourbrand.com"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              Public phone
            </span>
            <input
              name="contactPhone"
              type="tel"
              defaultValue={brand.contactPhone ?? ""}
              className="portal-input"
              placeholder="+250 7XX XXX XXX"
            />
          </label>
        </section>

        <section className="portal-card space-y-3 p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Social media</h2>
          <p className="text-xs text-[var(--portal-muted)]">
            Shown on product pages and your public brand page. Use full URLs or @handles.
          </p>
          {(
            [
              ["instagram", "Instagram", brand.instagram],
              ["tiktok", "TikTok", brand.tiktok],
              ["facebook", "Facebook", brand.facebook],
              ["twitter", "X / Twitter", brand.twitter],
              ["youtube", "YouTube", brand.youtube],
              ["website", "Website", brand.website],
            ] as const
          ).map(([name, label, value]) => (
            <label key={name} className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">{label}</span>
              <input
                name={name}
                defaultValue={value ?? ""}
                className="portal-input"
                placeholder={
                  name === "website"
                    ? "https://yoursite.com"
                    : `https://${name}.com/yourbrand`
                }
              />
            </label>
          ))}
        </section>

        <section className="portal-card space-y-3 p-5 sm:p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold">Default payout destination</h2>
          <p className="text-xs text-[var(--portal-muted)]">
            Used when you withdraw shop earnings from Payments.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">Provider</span>
              <select
                name="payoutProvider"
                className="portal-input appearance-none"
                defaultValue={brand.payoutProvider ?? "mtn"}
              >
                <option value="mtn">MTN MoMo</option>
                <option value="airtel">Airtel Money</option>
                <option value="bank">Bank transfer</option>
                <option value="stripe">Stripe</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Phone / account number
              </span>
              <input
                name="payoutAccount"
                defaultValue={brand.payoutAccount ?? ""}
                className="portal-input"
                placeholder="078xxxxxxx"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="portal-btn portal-btn--accent disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save settings"}
          </button>
        </section>
      </form>

      <section className="portal-card space-y-3 p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Change password</h2>
        <p className="text-xs text-[var(--portal-muted)]">
          After updating, you’ll be signed out and need to log in with the new
          password. Forgot it?{" "}
          <Link href="/forgot-password" className="underline">
            Reset by email
          </Link>
          .
        </p>
        <form onSubmit={onChangePassword} className="grid max-w-md gap-3 sm:grid-cols-1">
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              Current password
            </span>
            <input
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className="portal-input"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              New password
            </span>
            <input
              name="nextPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="portal-input"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              Confirm new password
            </span>
            <input
              name="confirm"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="portal-input"
            />
          </label>
          {passwordError ? (
            <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-[var(--portal-accent)]">
              {passwordError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={passwordPending}
            className="portal-btn portal-btn--ghost disabled:opacity-60"
          >
            {passwordPending ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}
