"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Container } from "@/components/container";
import { useAuth } from "@/components/auth-provider";
import { CultureIcon } from "@/components/culture-icons";
import { initialsFromName } from "@/lib/avatar";

const LINKS = [
  {
    href: "/account/orders",
    label: "Orders",
    hint: "Track deliveries",
    icon: "spiral" as const,
  },
  {
    href: "/account/profile",
    label: "Profile",
    hint: "Photo, phone, shipping address",
    icon: "necklace" as const,
  },
  {
    href: "/account/security",
    label: "Security",
    hint: "Change your password",
    icon: "shield" as const,
  },
  {
    href: "/shop",
    label: "Shop",
    hint: "Browse products",
    icon: "cloth" as const,
  },
  {
    href: "/cart",
    label: "Bag",
    hint: "Checkout",
    icon: "pot" as const,
  },
  {
    href: "/events",
    label: "Events",
    hint: "Buy tickets",
    icon: "drum" as const,
  },
  {
    href: "/track",
    label: "Track",
    hint: "Lookup by reference",
    icon: "drum" as const,
  },
  {
    href: "/contact",
    label: "Support",
    hint: "Orders & help",
    icon: "spiral" as const,
  },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/account");
      return;
    }
    if (user.type === "brand") router.replace("/portal");
    if (user.type === "admin") router.replace("/admin");
  }, [user, loading, router]);

  if (loading || !user || user.type !== "client") {
    return (
      <Container className="py-20">
        <p className="text-sm text-bone-dim">Loading account…</p>
      </Container>
    );
  }

  return (
    <Container className="py-12 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Client</p>
          <h1 className="font-display mt-2 text-5xl tracking-[0.03em]">
            My account
          </h1>
        </div>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.push("/");
            router.refresh();
          }}
          className="inline-flex min-h-11 min-w-11 items-center justify-center text-bone-dim transition-colors hover:text-rust"
          aria-label="Log out"
          title="Log out"
        >
          <CultureIcon name="logout" className="h-6 w-6" />
        </button>
      </div>

      <div className="store-board mt-10 flex flex-wrap items-center gap-5">
        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-ash text-lg font-bold">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            initialsFromName(user.name)
          )}
        </div>
        <div>
          <p className="font-display text-3xl tracking-[0.04em]">{user.name}</p>
          <p className="mt-1 text-sm text-bone-dim">{user.email}</p>
          {user.phone ? (
            <p className="mt-1 text-sm text-bone-dim">{user.phone}</p>
          ) : null}
          <Link
            href="/account/profile"
            className="mt-3 inline-block text-xs tracking-[0.14em] text-rust uppercase underline underline-offset-4"
          >
            Edit profile
          </Link>
        </div>
      </div>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="store-board flex h-full flex-col gap-2 transition-transform hover:-translate-y-0.5"
            >
              <CultureIcon name={item.icon} className="h-5 w-5 text-rust" />
              <span className="font-display text-xl tracking-[0.04em]">
                {item.label}
              </span>
              <span className="text-sm text-bone-dim">{item.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
