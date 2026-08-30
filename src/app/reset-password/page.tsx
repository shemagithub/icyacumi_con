"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Container } from "@/components/container";
import { PasswordInput } from "@/components/password-input";

function ResetForm() {
  const router = useRouter();
  const search = useSearchParams();
  const emailFromQuery = search.get("email") ?? "";
  const [email, setEmail] = useState(emailFromQuery);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);

  async function resendCode() {
    const target = email.trim();
    if (!target) {
      setError("Enter your email first, then resend the code.");
      return;
    }
    setResending(true);
    setError(null);
    setInfo(null);
    setDevCode(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not resend code.");
        return;
      }
      setInfo(
        typeof data.message === "string"
          ? data.message
          : "If that email is registered, we sent a new code.",
      );
      if (typeof data.devCode === "string") setDevCode(data.devCode);
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setResending(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setInfo(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password !== confirm) {
      setError("Passwords do not match.");
      setPending(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          code: form.get("code"),
          password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not reset password.");
        return;
      }
      router.push(data.redirectTo ?? "/login?reset=1");
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
      <h1 className="font-display mt-2 text-4xl tracking-[0.03em]">
        Reset password
      </h1>
      <p className="mt-3 text-sm text-bone-dim">
        Enter the 6-digit code from your email, then choose a new password
        (at least 6 characters).
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="eyebrow mb-2 block">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field-input"
          />
        </label>
        <label className="block">
          <span className="eyebrow mb-2 block">Reset code</span>
          <input
            name="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoComplete="one-time-code"
            className="field-input tracking-[0.35em]"
            placeholder="000000"
          />
        </label>
        <PasswordInput
          name="password"
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
        {info ? (
          <p role="status" className="border border-coal/15 bg-bone px-3 py-3 text-sm text-coal">
            {info}
          </p>
        ) : null}
        {devCode ? (
          <p role="status" className="border border-coal/15 bg-bone px-3 py-3 text-sm text-coal">
            Local / SMTP not configured · use code{" "}
            <code className="tracking-[0.25em] font-semibold">{devCode}</code>
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="craft-btn w-full bg-rust px-6 py-4 text-xs tracking-[0.2em] text-bone uppercase disabled:opacity-60"
        >
          {pending ? "Saving…" : "Set new password"}
        </button>
      </form>

      <button
        type="button"
        disabled={resending}
        onClick={() => void resendCode()}
        className="mt-4 w-full text-center text-sm text-bone-dim underline hover:text-rust disabled:opacity-60"
      >
        {resending ? "Sending new code…" : "Resend code"}
      </button>

      <p className="mt-6 text-sm text-bone-dim">
        <Link href="/forgot-password" className="underline hover:text-rust">
          Start over
        </Link>
        {" · "}
        <Link href="/login?next=/" className="underline hover:text-rust">
          Back to log in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Container className="py-16 lg:py-24">
      <Suspense fallback={<p className="text-center text-sm text-bone-dim">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </Container>
  );
}
