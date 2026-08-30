"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Container } from "@/components/container";
import { useAuth } from "@/components/auth-provider";
import { fileToAvatarDataUrl } from "@/lib/avatar";
import { PasswordInput } from "@/components/password-input";
import { TermsAcceptCheckbox } from "@/components/terms-accept-checkbox";

type Step = "basics" | "address" | "verify";

const STEPS: { id: Step; label: string }[] = [
  { id: "basics", label: "Profile" },
  { id: "address", label: "Address" },
  { id: "verify", label: "Verify" },
];

type Draft = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
  avatarUrl: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const EMPTY: Draft = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirm: "",
  avatarUrl: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Rwanda",
};

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [step, setStep] = useState<Step>("basics");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [code, setCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function onAvatarChange(file: File | null) {
    if (!file) {
      update("avatarUrl", "");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      update("avatarUrl", dataUrl);
      setError(null);
    } catch {
      setError("Could not process that image.");
    }
  }

  function goNextBasics(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (draft.password !== draft.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (draft.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setStep("address");
  }

  async function submitAddress(event: FormEvent) {
    event.preventDefault();
    if (!acceptedTerms) {
      setError("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          email: draft.email,
          password: draft.password,
          phone: draft.phone,
          avatarUrl: draft.avatarUrl || null,
          addressLine1: draft.addressLine1,
          addressLine2: draft.addressLine2,
          city: draft.city,
          state: draft.state,
          postalCode: draft.postalCode,
          country: draft.country,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not create account.");
        return;
      }
      setStep("verify");
      setInfo("We emailed a 6-digit code. Enter it below to continue.");
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setPending(false);
    }
  }

  async function submitVerify(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: draft.email, code }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not verify.");
        return;
      }
      await refresh();
      router.push(data.redirectTo ?? "/account");
      router.refresh();
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setPending(false);
    }
  }

  async function resendCode() {
    setPending(true);
    setError(null);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: draft.email }),
      });
      setInfo("A new code was sent if verification is still needed.");
    } catch {
      setError("Could not resend code.");
    } finally {
      setPending(false);
    }
  }

  const stepIndex = STEPS.findIndex((item) => item.id === step);

  return (
    <Container className="py-12 lg:py-20">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">Client</p>
        <h1 className="font-display mt-2 text-4xl tracking-[0.03em] sm:text-5xl">
          Create account
        </h1>
        <p className="mt-3 max-w-xl text-sm text-bone-dim">
          Set up your shopper profile, shipping details, then verify your email.
        </p>

        <ol className="mt-8 flex flex-wrap gap-2">
          {STEPS.map((item, index) => {
            const active = item.id === step;
            const done = index < stepIndex;
            return (
              <li
                key={item.id}
                className={`rounded-full px-3 py-1.5 text-[0.65rem] font-bold tracking-[0.14em] uppercase ${
                  active
                    ? "bg-rust text-bone"
                    : done
                      ? "bg-ash text-coal"
                      : "bg-ash/40 text-bone-dim"
                }`}
              >
                {index + 1}. {item.label}
              </li>
            );
          })}
        </ol>

        <div className="craft-panel mt-6 bg-bone/95 p-6 sm:p-8">
          {step === "basics" ? (
            <form onSubmit={goNextBasics} className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <label className="relative mx-auto flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-ash-line bg-ash/40 sm:mx-0">
                  {draft.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={draft.avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="px-2 text-center text-[0.65rem] tracking-[0.12em] text-bone-dim uppercase">
                      Photo
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) =>
                      void onAvatarChange(event.target.files?.[0] ?? null)
                    }
                  />
                </label>
                <div className="flex-1 text-sm text-bone-dim">
                  <p className="font-medium text-coal">Profile image</p>
                  <p className="mt-1">
                    Optional. Tap the circle to upload. We compress it for fast
                    checkout and account menus.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name">
                  <input
                    required
                    value={draft.name}
                    onChange={(e) => update("name", e.target.value)}
                    className="field-input"
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={draft.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="field-input"
                    placeholder="+250…"
                    autoComplete="tel"
                  />
                </Field>
              </div>

              <Field label="Email">
                <input
                  required
                  type="email"
                  value={draft.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="field-input"
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Password">
                  <PasswordInput
                    required
                    minLength={6}
                    value={draft.password}
                    onChange={(e) => update("password", e.target.value)}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirm password">
                  <PasswordInput
                    required
                    minLength={6}
                    value={draft.confirm}
                    onChange={(e) => update("confirm", e.target.value)}
                    autoComplete="new-password"
                  />
                </Field>
              </div>

              {error ? <ErrorBox>{error}</ErrorBox> : null}

              <button
                type="submit"
                className="craft-btn w-full bg-rust px-6 py-4 text-xs tracking-[0.2em] text-bone uppercase"
              >
                Next · shipping
              </button>
            </form>
          ) : null}

          {step === "address" ? (
            <form onSubmit={submitAddress} className="space-y-5">
              <p className="text-sm text-bone-dim">
                Default shipping address for faster checkout. You can edit this
                later in Profile.
              </p>
              <Field label="Address line 1">
                <input
                  value={draft.addressLine1}
                  onChange={(e) => update("addressLine1", e.target.value)}
                  className="field-input"
                  placeholder="Street, house, estate"
                  autoComplete="address-line1"
                />
              </Field>
              <Field label="Address line 2">
                <input
                  value={draft.addressLine2}
                  onChange={(e) => update("addressLine2", e.target.value)}
                  className="field-input"
                  placeholder="Apartment, landmark (optional)"
                  autoComplete="address-line2"
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="City">
                  <input
                    value={draft.city}
                    onChange={(e) => update("city", e.target.value)}
                    className="field-input"
                    autoComplete="address-level2"
                  />
                </Field>
                <Field label="State / province">
                  <input
                    value={draft.state}
                    onChange={(e) => update("state", e.target.value)}
                    className="field-input"
                    autoComplete="address-level1"
                  />
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Postal code">
                  <input
                    value={draft.postalCode}
                    onChange={(e) => update("postalCode", e.target.value)}
                    className="field-input"
                    autoComplete="postal-code"
                  />
                </Field>
                <Field label="Country">
                  <input
                    value={draft.country}
                    onChange={(e) => update("country", e.target.value)}
                    className="field-input"
                    autoComplete="country-name"
                  />
                </Field>
              </div>

              <TermsAcceptCheckbox
                checked={acceptedTerms}
                onChange={setAcceptedTerms}
              />

              {error ? <ErrorBox>{error}</ErrorBox> : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setStep("basics")}
                  className="craft-btn-ghost flex-1 px-6 py-4 text-xs tracking-[0.2em] uppercase"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={pending || !acceptedTerms}
                  className="craft-btn flex-1 bg-rust px-6 py-4 text-xs tracking-[0.2em] text-bone uppercase disabled:opacity-60"
                >
                  {pending ? "Creating…" : "Create & send code"}
                </button>
              </div>
            </form>
          ) : null}

          {step === "verify" ? (
            <form onSubmit={submitVerify} className="space-y-5">
              <p className="text-sm text-bone-dim">
                Enter the code sent to{" "}
                <span className="font-medium text-coal">{draft.email}</span>.
              </p>
              <Field label="Verification code">
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="field-input tracking-[0.35em]"
                  placeholder="000000"
                />
              </Field>
              {info ? <p className="text-sm text-bone-dim">{info}</p> : null}
              {error ? <ErrorBox>{error}</ErrorBox> : null}
              <button
                type="submit"
                disabled={pending}
                className="craft-btn w-full bg-rust px-6 py-4 text-xs tracking-[0.2em] text-bone uppercase disabled:opacity-60"
              >
                {pending ? "Verifying…" : "Verify & continue"}
              </button>
              <button
                type="button"
                onClick={() => void resendCode()}
                className="w-full text-xs tracking-[0.14em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
              >
                Resend code
              </button>
            </form>
          ) : null}
        </div>

        <p className="mt-6 text-sm text-bone-dim">
          Already have an account?{" "}
          <Link href="/login?next=/" className="text-coal underline hover:text-rust">
            Log in
          </Link>
          {" · "}
          <Link href="/brand-signup" className="text-coal underline hover:text-rust">
            Open a brand portal
          </Link>
        </p>
      </div>
    </Container>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
    </label>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="border border-rust/50 p-3 text-sm text-rust">
      {children}
    </p>
  );
}
