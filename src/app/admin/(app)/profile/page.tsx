"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { PasswordInput } from "@/components/password-input";

type Profile = {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
};

export default function AdminProfilePage() {
  const router = useRouter();
  const { logout, refresh } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/profile", { credentials: "include" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Could not load profile.");
      return;
    }
    setProfile(data.profile);
    setName(String(data.profile?.name ?? ""));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSaveProfile(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not save profile.");
        return;
      }
      setProfile(data.profile);
      setName(String(data.profile?.name ?? ""));
      setMessage("Profile updated.");
      await refresh();
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
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
      router.push(data.redirectTo ?? "/login?changed=1&next=/admin");
      router.refresh();
    } catch {
      setPasswordError("Could not reach the server.");
    } finally {
      setPasswordPending(false);
    }
  }

  if (!profile) {
    return (
      <p className="text-sm text-[var(--portal-muted)]">{error ?? "Loading profile…"}</p>
    );
  }

  const initial = (profile.name.trim()[0] || profile.email[0] || "A").toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="admin-section-title">Account</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Profile</h1>
        <p className="mt-2 text-sm text-[var(--portal-muted)]">
          Your admin name and password. To reset another super admin’s password,
          open{" "}
          <Link href="/admin/admins" className="underline">
            Super admins
          </Link>
          .
        </p>
      </header>

      {message ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-[var(--portal-accent)]">
          {error}
        </p>
      ) : null}

      <section className="portal-card flex items-center gap-4 p-5 sm:p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--portal-accent)] text-lg font-bold text-white">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{profile.name}</p>
          <p className="truncate text-sm text-[var(--portal-muted)]">{profile.email}</p>
        </div>
      </section>

      <form onSubmit={onSaveProfile} className="portal-card space-y-4 p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Display name</h2>
        <label className="block">
          <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="portal-input"
            required
            maxLength={120}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">Email</span>
          <input
            value={profile.email}
            readOnly
            className="portal-input opacity-70"
          />
          <span className="mt-1 block text-xs text-[var(--portal-muted)]">
            Email is your login · contact another admin to change it.
          </span>
        </label>
        <button type="submit" disabled={pending} className="portal-btn portal-btn--primary">
          {pending ? "Saving…" : "Save profile"}
        </button>
      </form>

      <form onSubmit={onChangePassword} className="portal-card space-y-4 p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Change your password</h2>
        <p className="text-xs text-[var(--portal-muted)]">
          After saving you will sign in again. Forgot it?{" "}
          <Link href="/forgot-password" className="underline">
            Reset by email
          </Link>
          .
        </p>
        {passwordError ? (
          <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-[var(--portal-accent)]">
            {passwordError}
          </p>
        ) : null}
        <PasswordInput
          label="Current password"
          name="currentPassword"
          required
          autoComplete="current-password"
        />
        <PasswordInput
          label="New password"
          name="nextPassword"
          required
          minLength={6}
          autoComplete="new-password"
        />
        <PasswordInput
          label="Confirm new password"
          name="confirm"
          required
          minLength={6}
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={passwordPending}
          className="portal-btn portal-btn--accent"
        >
          {passwordPending ? "Updating…" : "Update password"}
        </button>
      </form>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/admins" className="portal-btn portal-btn--ghost !text-xs">
          Manage super admin passwords
        </Link>
        <Link href="/admin/orders" className="portal-btn portal-btn--ghost !text-xs">
          View orders
        </Link>
        <Link href="/admin" className="portal-btn portal-btn--ghost !text-xs">
          Back to overview
        </Link>
      </div>
    </div>
  );
}
