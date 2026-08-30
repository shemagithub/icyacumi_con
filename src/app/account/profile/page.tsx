"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Container } from "@/components/container";
import { useAuth } from "@/components/auth-provider";
import { fileToAvatarDataUrl } from "@/lib/avatar";

type Profile = {
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

export default function AccountProfilePage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/account/profile");
      return;
    }
    if (user.type !== "client") {
      router.replace(user.type === "admin" ? "/admin" : "/portal");
      return;
    }
    void (async () => {
      const response = await fetch("/api/auth/profile", { credentials: "include" });
      const data = await response.json();
      if (response.ok) setProfile(data.profile);
    })();
  }, [user, loading, router]);

  async function onAvatarChange(file: File | null) {
    if (!profile) return;
    if (!file) {
      setProfile({ ...profile, avatarUrl: null });
      return;
    }
    try {
      const avatarUrl = await fileToAvatarDataUrl(file);
      setProfile({ ...profile, avatarUrl });
    } catch {
      setError("Could not process that image.");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setPending(true);
    setError(null);
    setSaved(false);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          avatarUrl: profile.avatarUrl,
          addressLine1: form.get("addressLine1"),
          addressLine2: form.get("addressLine2"),
          city: form.get("city"),
          state: form.get("state"),
          postalCode: form.get("postalCode"),
          country: form.get("country"),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not save profile.");
        return;
      }
      setProfile(data.profile);
      await refresh();
      setSaved(true);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  if (loading || !user || user.type !== "client" || !profile) {
    return (
      <Container className="py-20">
        <p className="text-sm text-bone-dim">Loading profile…</p>
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
        <span className="text-coal">Profile</span>
      </nav>
      <h1 className="font-display mt-4 text-4xl tracking-[0.03em] sm:text-5xl">
        Profile
      </h1>
      <p className="mt-3 text-sm text-bone-dim">
        Keep your photo and shipping details ready for checkout.
      </p>

      <form
        onSubmit={onSubmit}
        className="craft-panel mt-8 max-w-2xl space-y-5 bg-bone/95 p-6 sm:p-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <label className="relative mx-auto flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-ash-line bg-ash/40 sm:mx-0">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[0.65rem] tracking-[0.12em] text-bone-dim uppercase">
                Photo
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => void onAvatarChange(e.target.files?.[0] ?? null)}
            />
          </label>
          <div className="text-sm text-bone-dim">
            <p className="font-medium text-coal">Profile image</p>
            <p className="mt-1">Tap to replace. Shown in the navbar when you’re signed in.</p>
            {profile.avatarUrl ? (
              <button
                type="button"
                onClick={() => setProfile({ ...profile, avatarUrl: null })}
                className="mt-2 text-xs uppercase underline hover:text-rust"
              >
                Remove photo
              </button>
            ) : null}
          </div>
        </div>

        <label className="block">
          <span className="eyebrow mb-2 block">Email</span>
          <input
            value={profile.email}
            disabled
            className="field-input opacity-70"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="eyebrow mb-2 block">Full name</span>
            <input
              name="name"
              required
              defaultValue={profile.name}
              className="field-input"
            />
          </label>
          <label className="block">
            <span className="eyebrow mb-2 block">Phone</span>
            <input
              name="phone"
              defaultValue={profile.phone ?? ""}
              className="field-input"
            />
          </label>
        </div>

        <label className="block">
          <span className="eyebrow mb-2 block">Address line 1</span>
          <input
            name="addressLine1"
            defaultValue={profile.addressLine1 ?? ""}
            className="field-input"
          />
        </label>
        <label className="block">
          <span className="eyebrow mb-2 block">Address line 2</span>
          <input
            name="addressLine2"
            defaultValue={profile.addressLine2 ?? ""}
            className="field-input"
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="eyebrow mb-2 block">City</span>
            <input name="city" defaultValue={profile.city ?? ""} className="field-input" />
          </label>
          <label className="block">
            <span className="eyebrow mb-2 block">State / province</span>
            <input name="state" defaultValue={profile.state ?? ""} className="field-input" />
          </label>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="eyebrow mb-2 block">Postal code</span>
            <input
              name="postalCode"
              defaultValue={profile.postalCode ?? ""}
              className="field-input"
            />
          </label>
          <label className="block">
            <span className="eyebrow mb-2 block">Country</span>
            <input
              name="country"
              defaultValue={profile.country ?? ""}
              className="field-input"
            />
          </label>
        </div>

        {error ? (
          <p role="alert" className="border border-rust/50 p-3 text-sm text-rust">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="text-sm text-paint-green">Profile saved.</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="craft-btn bg-rust px-8 py-4 text-xs tracking-[0.2em] text-bone uppercase disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </Container>
  );
}
