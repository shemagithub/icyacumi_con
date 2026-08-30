"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { CultureIcon } from "@/components/culture-icons";
import { useCart } from "@/components/cart-provider";
import { TermsAcceptCheckbox } from "@/components/terms-accept-checkbox";
import { saveCheckoutDraft } from "@/lib/checkout-draft";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import type { CartLine } from "@/lib/types";

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "RW", label: "Rwanda" },
  { value: "KE", label: "Kenya" },
  { value: "NG", label: "Nigeria" },
  { value: "ZA", label: "South Africa" },
  { value: "GH", label: "Ghana" },
] as const;

type Prefill = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  postal: string;
  country: string;
};

const EMPTY_PREFILL: Prefill = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  apartment: "",
  city: "",
  state: "",
  postal: "",
  country: "RW",
};

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: parts[0]! };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

function resolveCountryCode(raw: string | null | undefined) {
  if (!raw?.trim()) return "RW";
  const value = raw.trim();
  const upper = value.toUpperCase();
  if (COUNTRIES.some((country) => country.value === upper)) return upper;
  const byLabel = COUNTRIES.find(
    (country) => country.label.toLowerCase() === value.toLowerCase(),
  );
  if (byLabel) return byLabel.value;
  const aliases: Record<string, string> = {
    rwanda: "RW",
    kenya: "KE",
    nigeria: "NG",
    ghana: "GH",
    "south africa": "ZA",
    "united states": "US",
    usa: "US",
    "united kingdom": "GB",
    uk: "GB",
    canada: "CA",
  };
  return aliases[value.toLowerCase()] ?? "RW";
}

export function CheckoutForm({
  overrideLines,
  sharedCartToken,
  giftNote,
  ownerName,
  buyNow = false,
}: {
  overrideLines?: CartLine[];
  sharedCartToken?: string;
  giftNote?: string | null;
  ownerName?: string | null;
  buyNow?: boolean;
} = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const cart = useCart();
  const lines = overrideLines ?? cart.lines;
  const subtotal = overrideLines
    ? overrideLines.reduce((sum, line) => sum + line.price * line.quantity, 0)
    : cart.subtotal;
  const hydrated = overrideLines ? true : cart.hydrated;
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [prefill, setPrefill] = useState<Prefill>(EMPTY_PREFILL);
  const [fromAccount, setFromAccount] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!user || user.type !== "client") {
        if (!cancelled) {
          setPrefill(EMPTY_PREFILL);
          setFromAccount(false);
          setProfileReady(true);
        }
        return;
      }

      try {
        const response = await fetch("/api/auth/profile", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !data.profile) {
          // Fall back to session name / email / phone
          const { firstName, lastName } = splitName(user.name);
          if (!cancelled) {
            setPrefill({
              ...EMPTY_PREFILL,
              firstName,
              lastName,
              email: user.email,
              phone: user.phone ?? "",
            });
            setFromAccount(true);
            setProfileReady(true);
          }
          return;
        }

        const profile = data.profile as {
          name?: string;
          email?: string;
          phone?: string | null;
          addressLine1?: string | null;
          addressLine2?: string | null;
          city?: string | null;
          state?: string | null;
          postalCode?: string | null;
          country?: string | null;
        };
        const { firstName, lastName } = splitName(profile.name || user.name);
        if (!cancelled) {
          setPrefill({
            firstName,
            lastName,
            email: profile.email || user.email,
            phone: profile.phone || user.phone || "",
            address: profile.addressLine1 || "",
            apartment: profile.addressLine2 || "",
            city: profile.city || "",
            state: profile.state || "",
            postal: profile.postalCode || "",
            country: resolveCountryCode(profile.country),
          });
          setFromAccount(true);
          setProfileReady(true);
        }
      } catch {
        if (!cancelled) {
          const { firstName, lastName } = splitName(user.name);
          setPrefill({
            ...EMPTY_PREFILL,
            firstName,
            lastName,
            email: user.email,
            phone: user.phone ?? "",
          });
          setFromAccount(true);
          setProfileReady(true);
        }
      }
    }

    setProfileReady(false);
    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  function updateField<K extends keyof Prefill>(key: K, value: Prefill[K]) {
    setPrefill((prev) => ({ ...prev, [key]: value }));
  }

  const shipping =
    lines.length === 0 || subtotal >= site.freeShippingThreshold ? 0 : site.shippingRate;
  const total = subtotal + shipping;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acceptedTerms) {
      setCheckoutError("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }
    setPending(true);
    setCheckoutError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const name = `${String(form.get("firstName") ?? "").trim()} ${String(form.get("lastName") ?? "").trim()}`.trim();
    if (!email.includes("@") || !name || !String(form.get("address") ?? "").trim()) {
      setCheckoutError("Fill in contact and shipping before paying.");
      setPending(false);
      return;
    }

    saveCheckoutDraft({
      customer: {
        email,
        name,
        phone: String(form.get("phone") ?? "").trim() || undefined,
        line1: String(form.get("address") ?? "").trim(),
        line2: String(form.get("apartment") ?? "").trim() || undefined,
        city: String(form.get("city") ?? "").trim(),
        state: String(form.get("state") ?? "").trim() || undefined,
        postalCode: String(form.get("postal") ?? "").trim() || undefined,
        country: String(form.get("country") ?? "").trim(),
        notes: String(form.get("notes") ?? "").trim() || undefined,
      },
      items: lines.map((line) => ({
        productId: line.productId,
        size: line.size,
        color: line.color,
        quantity: line.quantity,
        kind: line.kind ?? (line.color === "Ticket" ? "ticket" : "product"),
        name: line.name,
        price: line.price,
        slug: line.slug,
        imageSrc: line.image?.src,
      })),
      sharedCartToken: sharedCartToken || undefined,
      giftNote: giftNote ?? null,
      ownerName: ownerName ?? null,
      acceptedTerms: true,
      buyNow: buyNow || undefined,
      createdAt: Date.now(),
    });

    router.push("/checkout/pay");
  }

  if (!hydrated) {
    return (
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]" aria-busy>
        <div className="h-96 animate-pulse bg-ash" />
        <div className="h-64 animate-pulse bg-ash" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="craft-panel mt-10 bg-bone/80 px-6 py-20 text-center">
        <CultureIcon name="pot" className="mx-auto h-10 w-10 text-rust" />
        <p className="font-display mt-6 text-2xl tracking-[0.05em]">Nothing to check out</p>
        <p className="mt-3 text-sm text-bone-dim">
          Your bag is empty. Add something, or use Buy now on a product page.
        </p>
        <Link
          href="/shop"
          className="mt-8 craft-btn inline-block bg-rust px-8 py-4 text-xs tracking-[0.2em] text-bone uppercase transition-colors hover:bg-sand"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 xl:gap-20"
    >
      <div className="space-y-10">
        {buyNow ? (
          <div className="rounded-xl border border-ash-line bg-ash/40 px-5 py-4">
            <p className="eyebrow">Buy now</p>
            <p className="mt-2 text-sm text-coal">
              Checking out this item only · your bag is left as it is.
            </p>
          </div>
        ) : null}
        {sharedCartToken ? (
          <div className="rounded-xl border border-ash-line bg-ash/40 px-5 py-4">
            <p className="eyebrow">Paying for someone</p>
            <p className="mt-2 text-sm text-coal">
              {ownerName
                ? `You’re covering ${ownerName}’s bag.`
                : "You’re covering a shared bag."}{" "}
              No account required.
            </p>
            {giftNote ? (
              <p className="mt-2 text-sm text-bone-dim italic">“{giftNote}”</p>
            ) : null}
          </div>
        ) : null}

        {fromAccount && profileReady ? (
          <p className="rounded-lg border border-ash-line bg-ash/40 px-4 py-3 text-sm text-bone-dim">
            Details filled from your account.{" "}
            <Link
              href="/account/profile"
              className="font-semibold text-rust underline underline-offset-4"
            >
              Edit profile
            </Link>{" "}
            anytime · you can still change fields here before paying.
          </p>
        ) : null}

        <section className="craft-panel culture-rise bg-bone/90 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <CultureIcon name="drum" className="h-5 w-5 text-rust" />
            <div>
              <p className="eyebrow">Step 1</p>
              <h2 className="font-display text-2xl tracking-[0.05em]">Contact</h2>
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Field label="First name" htmlFor="checkout-first">
              <input
                id="checkout-first"
                name="firstName"
                type="text"
                required
                autoComplete="given-name"
                className="field-input"
                placeholder="First name"
                value={prefill.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
              />
            </Field>
            <Field label="Last name" htmlFor="checkout-last">
              <input
                id="checkout-last"
                name="lastName"
                type="text"
                required
                autoComplete="family-name"
                className="field-input"
                placeholder="Last name"
                value={prefill.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
              />
            </Field>
            <Field label="Email" htmlFor="checkout-email">
              <input
                id="checkout-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="field-input"
                placeholder="you@email.com"
                value={prefill.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </Field>
            <Field label="Phone" htmlFor="checkout-phone">
              <input
                id="checkout-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="field-input"
                placeholder="Optional"
                value={prefill.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="craft-panel culture-rise bg-bone/90 p-6 sm:p-8" style={{ animationDelay: "0.08s" }}>
          <div className="flex items-center gap-3">
            <CultureIcon name="hut" className="h-5 w-5 text-rust" />
            <div>
              <p className="eyebrow">Step 2</p>
              <h2 className="font-display text-2xl tracking-[0.05em]">Shipping</h2>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <Field label="Address" htmlFor="checkout-address">
              <input
                id="checkout-address"
                name="address"
                type="text"
                required
                autoComplete="address-line1"
                className="field-input"
                placeholder="Street address"
                value={prefill.address}
                onChange={(event) => updateField("address", event.target.value)}
              />
            </Field>
            <Field label="Apartment, suite" htmlFor="checkout-apt">
              <input
                id="checkout-apt"
                name="apartment"
                type="text"
                autoComplete="address-line2"
                className="field-input"
                placeholder="Optional"
                value={prefill.apartment}
                onChange={(event) => updateField("apartment", event.target.value)}
              />
            </Field>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="City" htmlFor="checkout-city">
                <input
                  id="checkout-city"
                  name="city"
                  type="text"
                  required
                  autoComplete="address-level2"
                  className="field-input"
                  placeholder="City"
                  value={prefill.city}
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </Field>
              <Field label="State / Province" htmlFor="checkout-state">
                <input
                  id="checkout-state"
                  name="state"
                  type="text"
                  autoComplete="address-level1"
                  className="field-input"
                  placeholder="State (optional)"
                  value={prefill.state}
                  onChange={(event) => updateField("state", event.target.value)}
                />
              </Field>
              <Field label="Postal code" htmlFor="checkout-postal">
                <input
                  id="checkout-postal"
                  name="postal"
                  type="text"
                  autoComplete="postal-code"
                  className="field-input"
                  placeholder="Code (optional)"
                  value={prefill.postal}
                  onChange={(event) => updateField("postal", event.target.value)}
                />
              </Field>
              <Field label="Country" htmlFor="checkout-country">
                <select
                  id="checkout-country"
                  name="country"
                  required
                  autoComplete="country"
                  className="field-input appearance-none"
                  value={prefill.country}
                  onChange={(event) => updateField("country", event.target.value)}
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Order notes" htmlFor="checkout-notes">
              <textarea
                id="checkout-notes"
                name="notes"
                rows={3}
                className="field-input min-h-[5.5rem] resize-y"
                placeholder="Delivery notes, gift message, or fit reminder · optional."
              />
            </Field>
          </div>
        </section>

        <section className="craft-panel culture-rise bg-ash/50 p-6 sm:p-8" style={{ animationDelay: "0.14s" }}>
          <div className="flex items-center gap-3">
            <CultureIcon name="shield" className="h-5 w-5 text-rust" />
            <div>
              <p className="eyebrow">Next</p>
              <h2 className="font-display text-2xl tracking-[0.05em]">Choose how to pay</h2>
            </div>
          </div>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-bone-dim">
            After you confirm address details, you&apos;ll pick MTN MoMo, Airtel Money,
            or card on the next screen.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-bone-dim">
            <li className="flex gap-2">
              <CultureIcon name="spiral" className="mt-0.5 h-4 w-4 shrink-0 text-rust" />
              Free shipping over {formatPrice(site.freeShippingThreshold)}
            </li>
            <li className="flex gap-2">
              <CultureIcon name="cloth" className="mt-0.5 h-4 w-4 shrink-0 text-rust" />
              30-day returns on unworn pieces
            </li>
            <li className="flex gap-2">
              <CultureIcon name="mask" className="mt-0.5 h-4 w-4 shrink-0 text-rust" />
              Ships within two business days
            </li>
          </ul>
        </section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="craft-panel bg-bone/95 p-6 sm:p-8">
          <p className="eyebrow">Your order</p>
          <h2 className="font-display mt-2 text-2xl tracking-[0.05em]">Summary</h2>

          <ul className="mt-6 divide-y divide-ash-line border-y border-ash-line">
            {lines.map((line) => (
              <li key={line.id} className="flex gap-4 py-4">
                  <Link
                    href={
                      line.kind === "ticket" || line.color === "Ticket"
                        ? `/events/${line.slug}`
                        : `/shop/${line.slug}`
                    }
                    className="craft-frame craft-frame--soft relative aspect-[4/5] w-16 shrink-0 overflow-hidden bg-ash"
                  >
                  {line.image && (
                    <Image
                      src={line.image.src}
                      alt={line.image.alt}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base tracking-[0.04em]">{line.name}</p>
                  <p className="mt-1 text-[0.65rem] tracking-[0.14em] text-bone-dim uppercase">
                    {line.kind === "ticket" || line.color === "Ticket"
                      ? `Ticket · Qty ${line.quantity}`
                      : `${line.color} / ${line.size} · Qty ${line.quantity}`}
                  </p>
                  <p className="mt-2 text-sm tabular-nums">
                    {formatPrice(line.price * line.quantity)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-bone-dim">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-bone-dim">Shipping</dt>
              <dd className="tabular-nums">
                {shipping === 0 ? "Free" : formatPrice(shipping)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex justify-between border-t border-ash-line pt-4 text-lg">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(total)}</span>
          </div>

          {shipping > 0 && (
            <p className="mt-3 text-xs text-bone-dim">
              {formatPrice(site.freeShippingThreshold - subtotal)} away from free shipping.
            </p>
          )}

          <TermsAcceptCheckbox
            id="checkout-accept-terms"
            checked={acceptedTerms}
            onChange={setAcceptedTerms}
          />

          <button
            type="submit"
            disabled={pending || !acceptedTerms}
            className="craft-btn mt-8 w-full bg-rust px-6 py-4 text-xs tracking-[0.2em] text-bone uppercase transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Continuing…" : "Continue to payment"}
          </button>

          {checkoutError && (
            <p role="alert" className="mt-4 border border-rust/50 p-4 text-sm text-rust">
              {checkoutError}
            </p>
          )}

          <Link
            href={sharedCartToken ? `/pay/${sharedCartToken}` : "/cart"}
            className="mt-4 block text-center text-xs tracking-[0.16em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
          >
            {sharedCartToken ? "Back to shared bag" : "Back to bag"}
          </Link>
        </div>
      </aside>
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
