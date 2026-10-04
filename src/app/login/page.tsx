"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Container } from "@/components/container";
import { useAuth } from "@/components/auth-provider";
import { PasswordInput } from "@/components/password-input";
import { destinationAfterLogin } from "@/lib/auth-redirect";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next");
  const emailFromQuery = search.get("email") ?? "";
  const resetOk = search.get("reset") === "1";
  const changedOk = search.get("changed") === "1";
  const { refresh } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          as: "auto",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.needsVerification && data.email) {
          router.push(`/verify-email?email=${encodeURIComponent(String(data.email))}`);
          return;
        }
        if (data.needsApproval) {
          router.push(
            String(
              data.redirectTo ??
                `/brand-pending?email=${encodeURIComponent(String(data.email ?? ""))}&brand=${encodeURIComponent(String(data.brandName ?? "Your brand"))}&status=${encodeURIComponent(String(data.status ?? "pending"))}`,
            ),
          );
          return;
        }
        setError(data.error ?? "Login failed.");
        return;
      }
      await refresh();
      router.push(destinationAfterLogin(String(data.role ?? ""), next));
      router.refresh();
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="craft-panel mx-auto max-w-md bg-bone/95 p-6 sm:p-8">
      <p className="eyebrow">Account</p>
      <h1 className="font-display mt-2 text-4xl tracking-[0.03em]">Log in</h1>
      <p className="mt-3 text-sm text-bone-dim">
        One login for everyone. We send you to client account, brand portal, or
        super admin based on your account.
      </p>

      {resetOk ? (
        <p
          role="status"
          className="mt-5 border border-paint-green/40 bg-paint-green/10 px-3 py-3 text-sm text-coal"
        >
          Password updated. Log in with your new password.
        </p>
      ) : null}
      {changedOk ? (
        <p
          role="status"
          className="mt-5 border border-paint-green/40 bg-paint-green/10 px-3 py-3 text-sm text-coal"
        >
          Password changed. Log in again with your new password.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="eyebrow mb-2 block">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            defaultValue={emailFromQuery}
            className="field-input"
            placeholder="you@email.com"
          />
        </label>
        <PasswordInput
          name="password"
          label="Password"
          required
          autoComplete="current-password"
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
          {pending ? "Signing in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-bone-dim">
        New shopper?{" "}
        <Link href="/register" className="text-coal underline hover:text-rust">
          Create a client account
        </Link>
      </p>
      <p className="mt-3 text-sm text-bone-dim">
        Brand or maker?{" "}
        <Link href="/brand-signup" className="text-coal underline hover:text-rust">
          Open a brand portal
        </Link>
      </p>
      <p className="mt-3 text-sm text-bone-dim">
        <Link href="/forgot-password" className="underline hover:text-rust">
          Forgot password?
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Container className="py-16 lg:py-24">
      <Suspense fallback={<p className="text-center text-sm text-bone-dim">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </Container>
  );
}
