/**
 * XentriPay Collections client (MoMo + card).
 * Auth: X-XENTRIPAY-KEY. Never send this key to the browser.
 *
 * Docs: Collections | Payouts | Checkout
 * Test:  https://merchant.test.xentripay.com
 * Live:  https://xentripay.com
 */

export const XENTRIPAY_MIN_AMOUNT = 100;

export type XentriPayPMethod = "momo" | "cc";

export type InitiateCollectionInput = {
  email: string;
  cname: string;
  amount: number;
  cnumber: string;
  msisdn: string;
  pmethod: XentriPayPMethod;
  customerRef: string;
  chargesIncluded?: boolean;
  redirecturl?: string;
  returl?: string;
  details?: string;
};

export type InitiateCollectionResult = {
  success: boolean;
  reply?: string;
  url?: string | null;
  tid?: string;
  refid?: string;
  retcode?: number;
  message?: string;
};

export type CollectionStatusResult = {
  customerRef?: string;
  rid?: string;
  status?: "PENDING" | "SUCCESS" | "FAILED" | string;
  updatedAt?: string;
  message?: string;
};

export function isXentriPayConfigured() {
  return Boolean(process.env.XENTRIPAY_API_KEY?.trim());
}

export function xentriPayBaseUrl() {
  return (
    process.env.XENTRIPAY_BASE_URL?.trim() ||
    "https://merchant.test.xentripay.com"
  ).replace(/\/$/, "");
}

function apiKey() {
  const key = process.env.XENTRIPAY_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "XentriPay is not configured. Add XENTRIPAY_API_KEY to backend/.env.",
    );
  }
  return key;
}

/** Local 10-digit + international MSISDN for Rwanda numbers. */
export function rwandaCollectionPhones(raw: string): {
  cnumber: string;
  msisdn: string;
} | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  let local = digits;
  if (digits.startsWith("250") && digits.length === 12) {
    local = `0${digits.slice(3)}`;
  } else if (digits.length === 9 && digits.startsWith("7")) {
    local = `0${digits}`;
  } else if (digits.startsWith("0") && digits.length === 10) {
    local = digits;
  }

  if (!/^07\d{8}$/.test(local)) return null;
  return { cnumber: local, msisdn: `250${local.slice(1)}` };
}

async function xentriPayFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${xentriPayBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-XENTRIPAY-KEY": apiKey(),
      ...(init?.headers ?? {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  return { response, data };
}

function asString(value: unknown) {
  return typeof value === "string" ? value : value == null ? undefined : String(value);
}

export async function initiateCollection(
  input: InitiateCollectionInput,
): Promise<InitiateCollectionResult> {
  const amount = Math.round(input.amount);
  if (!Number.isFinite(amount) || amount < XENTRIPAY_MIN_AMOUNT) {
    return {
      success: false,
      message: `Amount must be at least ${XENTRIPAY_MIN_AMOUNT} RWF.`,
      retcode: 400,
    };
  }

  const body: Record<string, unknown> = {
    email: input.email,
    cname: input.cname,
    amount,
    cnumber: input.cnumber,
    msisdn: input.msisdn,
    currency: "RWF",
    pmethod: input.pmethod,
    chargesIncluded: input.chargesIncluded ?? true,
    customerRef: input.customerRef,
  };
  if (input.details) body.details = input.details;
  if (input.pmethod === "cc") {
    body.redirecturl = input.redirecturl;
    body.returl = input.returl;
  }

  const { response, data } = await xentriPayFetch("/api/collections/initiate", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const retcode = Number(data.retcode);
  const successFlag = data.success === 1 || data.success === true;
  const message =
    asString(data.message) ||
    asString(data.reply) ||
    (response.ok ? undefined : `XentriPay error (${response.status})`);

  if (!response.ok) {
    return {
      success: false,
      message: message ?? "Could not start payment with XentriPay.",
      retcode: Number.isFinite(retcode) ? retcode : response.status,
      reply: asString(data.reply),
    };
  }

  return {
    success: successFlag && (!Number.isFinite(retcode) || retcode === 0),
    reply: asString(data.reply),
    url: typeof data.url === "string" && data.url ? data.url : null,
    tid: asString(data.tid),
    refid: asString(data.refid),
    retcode: Number.isFinite(retcode) ? retcode : undefined,
    message,
  };
}

export async function getCollectionStatus(
  reference: string,
): Promise<CollectionStatusResult> {
  const ref = encodeURIComponent(reference);
  const { response, data } = await xentriPayFetch(
    `/api/collections/status/${ref}`,
  );
  const status = asString(data.status)?.toUpperCase();
  return {
    customerRef: asString(data.customerRef),
    rid: asString(data.rid) ?? asString(data.refid),
    status,
    updatedAt: asString(data.updatedAt),
    message:
      asString(data.message) ||
      asString(data.reply) ||
      (response.ok ? undefined : `Could not read payment status (${response.status}).`),
  };
}

export function retcodeMessage(retcode: number | undefined) {
  if (retcode === 606) {
    return "Payment failed. Check that the phone number is correct and has sufficient funds.";
  }
  if (retcode === 607) {
    return "Transaction declined by the mobile money provider.";
  }
  if (retcode === 608) {
    return "Payment timed out. Please try again.";
  }
  return "Could not start this payment. Try again.";
}
