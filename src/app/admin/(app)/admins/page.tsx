"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { PasswordInput } from "@/components/password-input";

type AdminRow = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export default function AdminTeamPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<AdminRow | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordPending, setPasswordPending] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/admins", { credentials: "include" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Could not load admins.");
      return;
    }
    setAdmins(data.admins ?? []);
    setCurrentId(typeof data.currentId === "string" ? data.currentId : null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const form = event.currentTarget;
    const body = new FormData(form);
    const response = await fetch("/api/admin/admins", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: body.get("name"),
        email: body.get("email"),
        password: body.get("password"),
      }),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Could not add that admin.");
      return;
    }
    form.reset();
    setMessage(`${data.admin?.name ?? "Admin"} can now sign in at /login.`);
    await load();
  }

  async function remove(admin: AdminRow) {
    if (!confirm(`Remove ${admin.name} (${admin.email}) from super admin?`)) return;
    setBusyId(admin.id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/admins/${admin.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not remove that admin.");
        return;
      }
      setMessage(`${admin.name} no longer has admin access.`);
      await load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusyId(null);
    }
  }

  async function onSetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordTarget) return;
    setPasswordPending(true);
    setPasswordError(null);
    setMessage(null);
    const form = event.currentTarget;
    const body = new FormData(form);
    const nextPassword = String(body.get("password") ?? "");
    const confirm = String(body.get("confirm") ?? "");
    if (nextPassword !== confirm) {
      setPasswordError("New passwords do not match.");
      setPasswordPending(false);
      return;
    }
    try {
      const response = await fetch(
        `/api/admin/admins/${passwordTarget.id}/password`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: nextPassword,
            confirm,
            yourPassword: body.get("yourPassword"),
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setPasswordError(data.error ?? "Could not update password.");
        return;
      }
      form.reset();
      setPasswordTarget(null);
      if (data.reLogin) {
        await logout();
        router.push(
          data.redirectTo ??
            `/login?changed=1&next=${encodeURIComponent("/admin")}`,
        );
        router.refresh();
        return;
      }
      setMessage(data.message ?? "Password updated.");
    } catch {
      setPasswordError("Could not reach the server.");
    } finally {
      setPasswordPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight">Super admins</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--portal-muted)]">
            Add people who can run the marketplace panel, and set or reset their
            passwords. You can also change your own password here or on{" "}
            <Link href="/admin/profile" className="underline">
              Profile
            </Link>
            .
          </p>
        </div>
        <Link href="/admin/profile" className="portal-btn portal-btn--ghost">
          My password →
        </Link>
      </header>

      {message ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-[var(--portal-accent)]">
          {error}
        </p>
      ) : null}

      {passwordTarget ? (
        <form
          onSubmit={onSetPassword}
          className="portal-card mx-auto max-w-lg space-y-4 p-5 sm:p-6"
        >
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {passwordTarget.id === currentId
                ? "Change your password"
                : `Set password for ${passwordTarget.name}`}
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--portal-muted)]">
              {passwordTarget.email}
              {passwordTarget.id === currentId
                ? " · You will sign in again after saving."
                : " · Confirm with your own password so only a logged-in admin can reset this."}
            </p>
          </div>
          {passwordError ? (
            <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-[var(--portal-accent)]">
              {passwordError}
            </p>
          ) : null}
          <PasswordInput
            label="New password"
            name="password"
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
          <PasswordInput
            label="Your current password (confirm)"
            name="yourPassword"
            required
            autoComplete="current-password"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={passwordPending}
              className="portal-btn portal-btn--accent"
            >
              {passwordPending ? "Saving…" : "Save password"}
            </button>
            <button
              type="button"
              className="portal-btn portal-btn--ghost"
              onClick={() => {
                setPasswordTarget(null);
                setPasswordError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <form onSubmit={onCreate} className="portal-card h-fit space-y-4 p-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Add admin</h2>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">
              Password must be at least 6 characters.
            </p>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              Name
            </span>
            <input
              name="name"
              required
              className="portal-input"
              placeholder="Aline Umutoni"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              Email
            </span>
            <input
              name="email"
              type="email"
              required
              className="portal-input"
              placeholder="icyacumiicon@gmail.com"
            />
          </label>
          <PasswordInput
            label="Password"
            name="password"
            required
            minLength={6}
            autoComplete="new-password"
          />
          <button
            type="submit"
            disabled={pending}
            className="portal-btn portal-btn--accent w-full"
          >
            {pending ? "Adding…" : "Add super admin"}
          </button>
        </form>

        <div className="portal-card overflow-hidden">
          <div className="border-b border-[var(--portal-line)] px-5 py-4">
            <h2 className="text-lg font-semibold tracking-tight">Team</h2>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">
              {admins.length}{" "}
              {admins.length === 1 ? "person" : "people"} with full access · use
              Set password to change any account.
            </p>
          </div>
          <ul className="divide-y divide-[var(--portal-line)]">
            {admins.map((admin) => {
              const you = admin.id === currentId;
              return (
                <li
                  key={admin.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--portal-ink)] text-xs font-bold text-white">
                    {admin.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {admin.name}
                      {you ? (
                        <span className="ml-2 text-[0.65rem] font-bold tracking-[0.12em] text-[var(--portal-accent)] uppercase">
                          You
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-sm text-[var(--portal-muted)]">
                      {admin.email}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--portal-muted)]">
                      Added {new Date(admin.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordTarget(admin);
                        setPasswordError(null);
                        setMessage(null);
                      }}
                      className="portal-btn portal-btn--ghost !py-2 !text-xs"
                    >
                      {you ? "Change password" : "Set password"}
                    </button>
                    <button
                      type="button"
                      disabled={you || admins.length < 2 || busyId === admin.id}
                      onClick={() => void remove(admin)}
                      className="portal-btn portal-btn--ghost !py-2 !text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {busyId === admin.id ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </li>
              );
            })}
            {admins.length === 0 ? (
              <li className="px-5 py-10 text-sm text-[var(--portal-muted)]">
                No admins yet.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
