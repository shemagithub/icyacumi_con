"use client";

import { useId, useState, type FormEvent } from "react";

export function NewsletterForm({
  source = "site",
  inputId,
  className = "",
}: {
  source?: string;
  inputId?: string;
  className?: string;
}) {
  const autoId = useId();
  const fieldId = inputId ?? `newsletter-email-${autoId}`;
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "joined" | "already">("idle");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/catalog/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not subscribe. Try again.");
        return;
      }
      setStatus(data.alreadySubscribed ? "already" : "joined");
      setEmail("");
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (status !== "idle") {
    return (
      <p role="status" className="text-sm leading-relaxed text-sage">
        {status === "already"
          ? "You're already on the list · we'll keep you posted."
          : "You're on the list. Watch for the next drop."}
      </p>
    );
  }

  return (
    <div className={className}>
      <form
        onSubmit={onSubmit}
        className="flex max-w-sm items-center gap-0 border-b border-ash-line focus-within:border-rust"
      >
        <label htmlFor={fieldId} className="sr-only">
          Email address
        </label>
        <input
          id={fieldId}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="your@email.com"
          disabled={pending}
          className="min-w-0 flex-1 bg-transparent py-3 text-sm text-coal outline-none placeholder:text-bone-dim/60 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 py-3 pl-4 text-xs tracking-[0.18em] text-coal uppercase transition-colors hover:text-rust disabled:opacity-60"
        >
          {pending ? "…" : "Subscribe"}
        </button>
      </form>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-rust">
          {error}
        </p>
      ) : null}
    </div>
  );
}
