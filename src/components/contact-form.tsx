"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { site } from "@/lib/site";

const SUBJECTS = [
  "Order & shipping",
  "Sizing & fit",
  "Press & collab",
  "Wholesale",
  "Something else",
] as const;

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [mailed, setMailed] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (status === "sent") {
    return (
      <div className="craft-panel bg-ash/60 px-6 py-10 text-center">
        <p className="font-display text-2xl tracking-[0.06em]">Message received</p>
        <p className="mt-3 text-sm leading-relaxed text-bone-dim">
          {mailed
            ? "We emailed you a confirmation and will reply soon · sooner if you wrote about an open order."
            : "We saved your message and will reply soon. Email confirmation is offline right now."}
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-8 text-xs tracking-[0.2em] text-rust uppercase transition-colors hover:text-sand"
        >
          Send another
        </button>
      </div>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/catalog/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          subject: form.get("subject"),
          message: form.get("message"),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not send message.");
        setStatus("idle");
        return;
      }
      setMailed(data.mailed !== false);
      event.currentTarget.reset();
      setStatus("sent");
    } catch {
      setError("Could not reach the server. Is the backend running?");
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Name" htmlFor="contact-name">
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="field-input"
            placeholder="Your name"
          />
        </Field>
        <Field label="Email" htmlFor="contact-email">
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="field-input"
            placeholder="you@email.com"
          />
        </Field>
      </div>

      <Field label="Subject" htmlFor="contact-subject">
        <select
          id="contact-subject"
          name="subject"
          required
          defaultValue=""
          className="field-input appearance-none"
        >
          <option value="" disabled>
            Choose a topic
          </option>
          {SUBJECTS.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Message" htmlFor="contact-message">
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          className="field-input resize-y min-h-[9rem]"
          placeholder={`Tell us what you need · orders, fit, press, or a hello to ${site.name}.`}
        />
      </Field>

      {error ? (
        <p role="alert" className="border border-rust/50 p-3 text-sm text-rust">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "sending"}
        className="craft-btn w-full bg-rust px-8 py-4 text-xs tracking-[0.22em] text-bone uppercase transition-colors hover:bg-sand disabled:opacity-60 sm:w-auto"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
    </label>
  );
}
