"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Container } from "@/components/container";
import { useAuth } from "@/components/auth-provider";
import { PasswordInput } from "@/components/password-input";

export default function AccountSecurityPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/account/security");
      return;
    }
    if (user.type !== "client") {
      router.replace(user.type === "admin" ? "/admin/settings" : "/portal/settings");
    }
  }, [user, loading, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const nextPassword = String(form.get("nextPassword") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (nextPassword !== confirm) {
      setError("New passwords do not match.");
      setPending(false);
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
        setError(data.error ?? "Could not update password.");
        return;
      }
      await logout();
      router.push(data.redirectTo ?? "/login?changed=1");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  if (loading || !user || user.type !== "client") {
    return (
      <Container className="py-20">
        <p className="text-sm text-bone-dim">Loading security…</p>
      </Container>
    );
  }

  return (
    <Container className="py-12 lg:py-16">
      <nav className="text-xs tracking-[0.14em] text-bone-dim uppercase">
        <Link href="/account" className="hover:text-rust">
          Account
        </Link>
        <span aria-hidden> / </span>
        <span className="text-coal">Security</span>
      </nav>
      <h1 className="font-display mt-4 text-4xl tracking-[0.03em] sm:text-5xl">
        Change password
      </h1>
      <p className="mt-3 max-w-lg text-sm text-bone-dim">
        Enter your current password, then choose a new one (at least 6 characters).
        You’ll be signed out and asked to log in again with the new password.
      </p>

      <form
        onSubmit={onSubmit}
        className="craft-panel mt-8 max-w-md space-y-5 bg-bone/95 p-6 sm:p-8"
      >
        <PasswordInput
          name="currentPassword"
          label="Current password"
          required
          autoComplete="current-password"
        />
        <PasswordInput
          name="nextPassword"
          label="New password"
          required
          minLength={6}
          autoComplete="new-password"
        />
        <PasswordInput
          name="confirm"
          label="Confirm new password"
          required
          minLength={6}
          autoComplete="new-password"
        />

        {error ? (
          <p role="alert" className="border border-rust/50 p-3 text-sm text-rust">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="craft-btn w-full bg-rust px-6 py-4 text-xs tracking-[0.2em] text-bone uppercase disabled:opacity-60"
        >
          {pending ? "Updating…" : "Update password"}
        </button>

        <Link
          href="/forgot-password"
          className="block text-center text-xs tracking-[0.14em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
        >
          Forgot current password?
        </Link>
      </form>
    </Container>
  );
}
