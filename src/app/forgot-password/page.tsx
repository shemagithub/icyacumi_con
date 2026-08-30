"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Container } from "@/components/container";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [mailed, setMailed] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const nextEmail = String(form.get("email") ?? "").trim();
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not send reset code.");
        return;
      }
      setEmail(nextEmail);
      setMailed(Boolean(data.mailed));
      setDevCode(typeof data.devCode === "string" ? data.devCode : null);
      setMessage(
        typeof data.message === "string"
          ? data.message
          : "If that email is registered, we sent a reset code.",
      );
      setSent(true);
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setPending(false);
    }
  }

  return (
    <Container className="py-16 lg:py-24">
      <div className="craft-panel mx-auto max-w-md bg-bone/95 p-6 sm:p-8">
        <p className="eyebrow">Account</p>
        <h1 className="font-display mt-2 text-4xl tracking-[0.03em]">
          Forgot password
        </h1>

        {sent ? (
          <>
            <p className="mt-3 text-sm text-bone-dim">{message}</p>
            {mailed ? (
              <p className="mt-2 text-sm text-bone-dim">
                Look for an email from BONE KOBOYI with a 6-digit code.
              </p>
            ) : null}
            {devCode ? (
              <p
                role="status"
                className="mt-4 border border-coal/15 bg-bone px-4 py-3 text-sm text-coal"
              >
                Local / SMTP not configured · use code{" "}
                <code className="tracking-[0.25em] font-semibold">{devCode}</code>
              </p>
            ) : null}
            <Link
              href={`/reset-password?email=${encodeURIComponent(email)}`}
              className="craft-btn mt-8 inline-flex bg-rust px-6 py-4 text-xs tracking-[0.2em] text-bone uppercase"
            >
              Enter reset code
            </Link>
            <button
              type="button"
              className="mt-4 block text-sm text-bone-dim underline hover:text-rust"
              onClick={() => {
                setSent(false);
                setDevCode(null);
                setMessage(null);
              }}
            >
              Use a different email
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-bone-dim">
              Enter the email for your client, brand, or admin account. We’ll
              send a 6-digit code so you can choose a new password.
            </p>
            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="eyebrow mb-2 block">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue={email}
                  className="field-input"
                  placeholder="you@email.com"
                />
              </label>
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
                {pending ? "Sending…" : "Send reset code"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-sm text-bone-dim">
          <Link href="/login?next=/" className="underline hover:text-rust">
            Back to log in
          </Link>
        </p>
      </div>
    </Container>
  );
}
