"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type LegalPage = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
};

export default function AdminLegalPage() {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [activeId, setActiveId] = useState<"terms" | "privacy">("terms");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/legal", { credentials: "include" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Failed to load legal pages");
      return;
    }
    const list = (data.pages as LegalPage[]) ?? [];
    setPages(list);
    const current = list.find((page) => page.id === activeId) ?? list[0];
    if (current) {
      setActiveId(current.id as "terms" | "privacy");
      setTitle(current.title);
      setBody(current.body);
    }
  }, [activeId]);

  useEffect(() => {
    void load();
    // Intentionally load once on mount; tab switches use selectPage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectPage(id: "terms" | "privacy") {
    const page = pages.find((entry) => entry.id === id);
    setActiveId(id);
    setMessage(null);
    setError(null);
    if (page) {
      setTitle(page.title);
      setBody(page.body);
    }
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/legal/${activeId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      const saved = data.page as LegalPage;
      setPages((prev) =>
        prev.map((page) => (page.id === saved.id ? saved : page)),
      );
      setMessage(`${saved.title} updated. Live on the public site now.`);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Terms & privacy
        </h1>
        <p className="mt-1 text-sm text-[var(--portal-muted)]">
          Edit the public Terms & Conditions and Privacy Policy shown at signup
          and in the footer.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(["terms", "privacy"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => selectPage(id)}
            className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase ${
              activeId === id
                ? "bg-[var(--portal-accent)] text-white"
                : "bg-[var(--portal-bg)] text-[var(--portal-muted)]"
            }`}
          >
            {id === "terms" ? "Terms" : "Privacy"}
          </button>
        ))}
        <Link
          href={`/${activeId === "terms" ? "terms" : "privacy"}`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-xs font-semibold tracking-[0.12em] text-[var(--portal-accent)] uppercase underline"
        >
          View public page
        </Link>
      </div>

      {message ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-[var(--portal-accent)]">
          {error}
        </p>
      ) : null}

      <form onSubmit={onSave} className="portal-card space-y-4 p-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold tracking-[0.12em] text-[var(--portal-muted)] uppercase">
            Title
          </span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="portal-input"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold tracking-[0.12em] text-[var(--portal-muted)] uppercase">
            Body
          </span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            rows={18}
            className="portal-input min-h-[20rem] resize-y font-mono text-sm leading-relaxed"
          />
          <span className="mt-1 block text-xs text-[var(--portal-muted)]">
            Separate paragraphs with a blank line.
          </span>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="portal-btn portal-btn--accent disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
