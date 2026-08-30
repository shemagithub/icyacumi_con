"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Container } from "@/components/container";
import { useAuth } from "@/components/auth-provider";

function VerifyForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { refresh } = useAuth();
  const emailFromQuery = search.get("email") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setInfo(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          code: form.get("code"),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not verify.");
        return;
      }
      if (data.needsApproval) {
        router.push(
          String(
            data.redirectTo ??
              `/brand-pending?email=${encodeURIComponent(String(data.email ?? emailFromQuery))}&brand=${encodeURIComponent(String(data.brandName ?? "Your brand"))}`,
          ),
        );
        return;
      }
      await refresh();
      router.push(data.redirectTo ?? "/account");
      router.refresh();
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    const email =
      (document.getElementById("verify-email") as HTMLInputElement | null)
        ?.value ?? emailFromQuery;
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setInfo("A new code was sent if that email needs verification.");
    } catch {
      setError("Could not resend code.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="craft-panel mx-auto max-w-md bg-bone/95 p-6 sm:p-8">
      <p className="eyebrow">Account</p>
      <h1 className="font-display mt-2 text-4xl tracking-[0.03em]">
        Verify email
      </h1>
      <p className="mt-3 text-sm text-bone-dim">
        Enter the 6-digit code we sent to your inbox.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="eyebrow mb-2 block">Email</span>
          <input
            id="verify-email"
            name="email"
            type="email"
            required
            defaultValue={emailFromQuery}
            className="field-input"
          />
        </label>
        <label className="block">
          <span className="eyebrow mb-2 block">Code</span>
          <input
            name="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            className="field-input tracking-[0.35em]"
            placeholder="000000"
          />
        </label>

        {error ? (
          <p role="alert" className="border border-rust/50 p-3 text-sm text-rust">
            {error}
          </p>
        ) : null}
        {info ? <p className="text-sm text-bone-dim">{info}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="craft-btn w-full bg-rust px-6 py-4 text-xs tracking-[0.2em] text-bone uppercase disabled:opacity-60"
        >
          {pending ? "Checking…" : "Verify"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => void resend()}
        className="mt-4 text-xs tracking-[0.14em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
      >
        Resend code
      </button>

      <p className="mt-6 text-sm text-bone-dim">
        <Link href="/login?next=/" className="underline hover:text-rust">
          Back to log in
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Container className="py-16 lg:py-24">
      <Suspense fallback={<p className="text-center text-sm text-bone-dim">Loading…</p>}>
        <VerifyForm />
      </Suspense>
    </Container>
  );
}
