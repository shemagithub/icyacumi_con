"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Container } from "@/components/container";
import { CultureIcon, type CultureIconName } from "@/components/culture-icons";
import { PasswordInput } from "@/components/password-input";
import { TermsAcceptCheckbox } from "@/components/terms-accept-checkbox";
import { site } from "@/lib/site";

const ICONS: { value: CultureIconName; label: string }[] = [
  { value: "textile", label: "Textile" },
  { value: "cloth", label: "Cloth" },
  { value: "mask", label: "Mask" },
  { value: "necklace", label: "Necklace" },
  { value: "hut", label: "Hut" },
  { value: "drum", label: "Drum" },
];

const STEPS = [
  { id: 1, label: "Brand" },
  { id: 2, label: "Contact" },
  { id: 3, label: "Account" },
  { id: 4, label: "Review" },
] as const;

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export default function BrandSignupForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [brandName, setBrandName] = useState("");
  const [slugOverride, setSlugOverride] = useState("");
  const [location, setLocation] = useState("");
  const [shortBio, setShortBio] = useState("");
  const [applicationNote, setApplicationNote] = useState("");
  const [icon, setIcon] = useState<CultureIconName>("textile");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const slugPreview = useMemo(
    () => slugOverride || slugify(brandName) || "your-brand",
    [brandName, slugOverride],
  );

  function validateStep(current: number) {
    if (current === 1) {
      if (!brandName.trim() || !location.trim()) {
        return "Brand name and location are required.";
      }
      if (!applicationNote.trim() || applicationNote.trim().length < 20) {
        return "Tell us what you sell in at least 20 characters.";
      }
    }
    if (current === 2) {
      if (contactPhone.trim() && contactPhone.trim().length < 7) {
        return "Enter a valid phone number, or leave it blank.";
      }
    }
    if (current === 3) {
      if (!ownerName.trim() || !email.includes("@") || password.length < 6) {
        return "Your name, work email, and password (6+ chars) are required.";
      }
      if (password !== confirm) return "Passwords do not match.";
      if (!acceptedTerms) {
        return "Please accept the Terms & Conditions and Privacy Policy.";
      }
    }
    return null;
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    if (step === 2 && !contactEmail.trim() && email.includes("@")) {
      setContactEmail(email);
    }
    if (step === 3 && !contactEmail.trim()) {
      setContactEmail(email);
    }
    setStep((value) => Math.min(4, value + 1));
  }

  function goBack() {
    setError(null);
    setStep((value) => Math.max(1, value - 1));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const message = validateStep(3) || validateStep(1);
    if (message) {
      setError(message);
      setStep(message.includes("Password") || message.includes("Terms") ? 3 : 1);
      return;
    }
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/auth/register-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          slug: slugOverride || slugify(brandName),
          location,
          shortBio,
          applicationNote,
          icon,
          contactEmail: contactEmail || email,
          contactPhone,
          website,
          instagram,
          ownerName,
          email,
          password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not create brand account.");
        return;
      }
      router.push(
        data.redirectTo ??
          `/verify-email?email=${encodeURIComponent(String(data.email ?? email))}`,
      );
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setPending(false);
    }
  }

  return (
    <Container className="py-12 lg:py-16">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <aside>
          <p className="eyebrow">{site.madeIn}</p>
          <h1 className="font-display mt-2 text-4xl tracking-[0.03em] sm:text-5xl">
            Apply for a brand portal
          </h1>
          <p className="mt-4 text-base leading-relaxed text-bone-dim">
            Complete the steps, verify your email, then wait for platform approval.
            After approval you can log in and start selling.
          </p>
          <ol className="mt-8 space-y-4">
            {[
              "Create your brand profile",
              "Add contact details shoppers will see",
              "Set your portal login",
              "Verify email · wait for approval",
            ].map((item, index) => (
              <li key={item} className="flex gap-3 text-sm text-bone-dim">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rust text-[0.65rem] font-bold text-bone">
                  {index + 1}
                </span>
                <span className={index < step ? "text-coal" : undefined}>{item}</span>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm text-bone-dim">
            Already approved?{" "}
            <Link
              href="/login?next=/portal"
              className="text-coal underline hover:text-rust"
            >
              Log in to portal
            </Link>
          </p>
        </aside>

        <form
          onSubmit={onSubmit}
          className="craft-panel space-y-6 bg-bone/95 p-6 sm:p-8"
        >
          <div className="flex flex-wrap gap-2">
            {STEPS.map((item) => {
              const active = item.id === step;
              const done = item.id < step;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id < step) {
                      setError(null);
                      setStep(item.id);
                    }
                  }}
                  className={`rounded-full px-3 py-1.5 text-[0.65rem] font-bold tracking-[0.14em] uppercase transition-colors ${
                    active
                      ? "bg-rust text-bone"
                      : done
                        ? "bg-ash text-coal hover:bg-sand/40"
                        : "bg-ash/50 text-bone-dim"
                  }`}
                >
                  {item.id}. {item.label}
                </button>
              );
            })}
          </div>

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">Step 1</p>
                <h2 className="font-display mt-1 text-2xl tracking-[0.04em]">
                  Your brand
                </h2>
              </div>
              <label className="block">
                <span className="eyebrow mb-2 block">Brand name</span>
                <input
                  required
                  value={brandName}
                  onChange={(event) => setBrandName(event.target.value)}
                  className="field-input"
                  placeholder="Dust Atelier"
                  autoComplete="organization"
                />
              </label>
              <label className="block">
                <span className="eyebrow mb-2 block">Public URL</span>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-bone-dim">/brands/</span>
                  <input
                    value={slugOverride}
                    onChange={(event) => setSlugOverride(slugify(event.target.value))}
                    className="field-input min-w-0 flex-1"
                    placeholder={slugPreview}
                  />
                </div>
                <p className="mt-1 text-xs text-bone-dim">
                  Preview: <span className="text-coal">/brands/{slugPreview}</span>
                </p>
              </label>
              <label className="block">
                <span className="eyebrow mb-2 block">City / location</span>
                <input
                  required
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="field-input"
                  placeholder="Kigali, Rwanda"
                />
              </label>
              <label className="block">
                <span className="eyebrow mb-2 block">Short bio</span>
                <textarea
                  value={shortBio}
                  onChange={(event) => setShortBio(event.target.value)}
                  rows={2}
                  className="field-input resize-y"
                  placeholder="Sun-washed workwear and heavy fleece."
                  maxLength={500}
                />
              </label>
              <label className="block">
                <span className="eyebrow mb-2 block">What do you sell?</span>
                <textarea
                  required
                  value={applicationNote}
                  onChange={(event) => setApplicationNote(event.target.value)}
                  rows={3}
                  className="field-input resize-y"
                  placeholder="Tell us about your products, craft, and who you make for."
                  maxLength={1000}
                />
                <p className="mt-1 text-xs text-bone-dim">
                  Reviewed by the platform before your portal opens.
                </p>
              </label>
              <fieldset>
                <legend className="eyebrow mb-2 block">Mark icon</legend>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setIcon(item.value)}
                      className={`craft-chip inline-flex items-center gap-2 px-3 py-2 text-xs tracking-[0.12em] uppercase ${
                        icon === item.value ? "craft-chip--active" : "craft-chip--idle"
                      }`}
                    >
                      <CultureIcon name={item.value} className="h-3.5 w-3.5 text-rust" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">Step 2</p>
                <h2 className="font-display mt-1 text-2xl tracking-[0.04em]">
                  Public contact
                </h2>
                <p className="mt-2 text-sm text-bone-dim">
                  Shown on your brand profile after approval.
                </p>
              </div>
              <label className="block">
                <span className="eyebrow mb-2 block">Public email</span>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  className="field-input"
                  placeholder="hello@yourbrand.com"
                />
              </label>
              <label className="block">
                <span className="eyebrow mb-2 block">Phone</span>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  className="field-input"
                  placeholder="+250 7XX XXX XXX"
                />
              </label>
              <label className="block">
                <span className="eyebrow mb-2 block">Website (optional)</span>
                <input
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  className="field-input"
                  placeholder="https://yourbrand.com"
                />
              </label>
              <label className="block">
                <span className="eyebrow mb-2 block">Instagram (optional)</span>
                <input
                  value={instagram}
                  onChange={(event) => setInstagram(event.target.value)}
                  className="field-input"
                  placeholder="https://instagram.com/yourbrand"
                />
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">Step 3</p>
                <h2 className="font-display mt-1 text-2xl tracking-[0.04em]">
                  Portal login
                </h2>
              </div>
              <label className="block">
                <span className="eyebrow mb-2 block">Your name</span>
                <input
                  required
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  className="field-input"
                  placeholder="Ada"
                  autoComplete="name"
                />
              </label>
              <label className="block">
                <span className="eyebrow mb-2 block">Work email</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="field-input"
                  placeholder="you@brand.com"
                  autoComplete="email"
                />
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                <PasswordInput
                  label="Password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                />
                <PasswordInput
                  label="Confirm"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <TermsAcceptCheckbox
                id="brand-accept-terms"
                checked={acceptedTerms}
                onChange={setAcceptedTerms}
              />
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <div>
                <p className="eyebrow">Step 4</p>
                <h2 className="font-display mt-1 text-2xl tracking-[0.04em]">
                  Review & submit
                </h2>
              </div>
              <dl className="space-y-3 border border-ash-line bg-ash/20 px-4 py-4 text-sm">
                <div>
                  <dt className="text-[0.65rem] tracking-[0.14em] text-bone-dim uppercase">
                    Brand
                  </dt>
                  <dd className="mt-1 font-medium text-coal">
                    {brandName} · /brands/{slugPreview}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] tracking-[0.14em] text-bone-dim uppercase">
                    Location
                  </dt>
                  <dd className="mt-1 text-coal">{location}</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] tracking-[0.14em] text-bone-dim uppercase">
                    What you sell
                  </dt>
                  <dd className="mt-1 text-bone-dim">{applicationNote}</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] tracking-[0.14em] text-bone-dim uppercase">
                    Contact
                  </dt>
                  <dd className="mt-1 text-coal">
                    {contactEmail || email}
                    {contactPhone ? ` · ${contactPhone}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] tracking-[0.14em] text-bone-dim uppercase">
                    Owner login
                  </dt>
                  <dd className="mt-1 text-coal">
                    {ownerName} · {email}
                  </dd>
                </div>
              </dl>
              <p className="text-sm leading-relaxed text-bone-dim">
                Next we email a 6-digit code. After verify, your application waits for
                admin approval. You can enter the portal only once approved.
              </p>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="border border-rust/50 p-3 text-sm text-rust">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="craft-btn-ghost px-5 py-3 text-xs tracking-[0.16em] uppercase"
              >
                Back
              </button>
            ) : null}
            {step < 4 ? (
              <button
                type="button"
                onClick={goNext}
                className="craft-btn flex-1 bg-rust px-6 py-4 text-xs tracking-[0.2em] text-bone uppercase sm:flex-none"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={pending || !acceptedTerms}
                className="craft-btn flex-1 bg-rust px-6 py-4 text-xs tracking-[0.2em] text-bone uppercase disabled:opacity-60 sm:flex-none"
              >
                {pending ? "Submitting…" : "Submit application"}
              </button>
            )}
          </div>

          <p className="text-xs text-bone-dim">
            Shopping instead?{" "}
            <Link href="/register" className="underline hover:text-rust">
              Create a client account
            </Link>
          </p>
        </form>
      </div>
    </Container>
  );
}
