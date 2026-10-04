import { clearBuyNowLines } from "@/lib/buy-now";
import {
  clearCheckoutDraft,
  clearPaymentRef,
  readCheckoutDraft,
  savePaymentRef,
  type PaymentMethodId,
} from "@/lib/checkout-draft";

export type PaidOrder = {
  reference: string;
};

export type PaymentSessionResponse = {
  customerRef?: string;
  status?: string;
  redirectUrl?: string | null;
  reply?: string;
  error?: string;
  order?: PaidOrder | null;
};

export async function initiateXentriPay(input: {
  items: Array<{
    productId: string;
    size: string;
    color: string;
    quantity: number;
    kind?: string;
  }>;
  customer: Record<string, unknown>;
  paymentMethod: PaymentMethodId;
  couponCode?: string;
  sharedCartToken?: string;
}) {
  const response = await fetch("/api/catalog/payments/initiate", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json().catch(() => ({}))) as PaymentSessionResponse;
  if (!response.ok) {
    throw new Error(data.error ?? "Could not start payment.");
  }
  if (!data.customerRef) {
    throw new Error("Payment started without a reference. Try again.");
  }
  return data as PaymentSessionResponse & { customerRef: string };
}

export async function pollXentriPayStatus(
  customerRef: string,
  options?: { timeoutMs?: number; intervalMs?: number },
) {
  const timeoutMs = options?.timeoutMs ?? 4 * 60 * 1000;
  const intervalMs = options?.intervalMs ?? 3000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const response = await fetch(
      `/api/catalog/payments/status/${encodeURIComponent(customerRef)}`,
      { credentials: "include" },
    );
    const data = (await response.json().catch(() => ({}))) as PaymentSessionResponse;
    if (!response.ok) {
      throw new Error(data.error ?? "Could not check payment status.");
    }
    const status = String(data.status ?? "PENDING").toUpperCase();
    if (status === "SUCCESS" && data.order?.reference) {
      return data.order;
    }
    if (status === "FAILED") {
      throw new Error(data.error ?? "Payment failed or was cancelled.");
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    "Still waiting for confirmation. Approve the prompt on your phone, then try again.",
  );
}

export function finishPaidCheckout(order: PaidOrder, cart?: { clear: () => void }) {
  const draft = readCheckoutDraft();
  const wasBuyNow = Boolean(draft?.buyNow);
  clearCheckoutDraft();
  clearPaymentRef();
  clearBuyNowLines();
  if (!wasBuyNow) {
    cart?.clear();
  }
  window.location.href = `/checkout/success?ref=${encodeURIComponent(order.reference)}`;
}

export { savePaymentRef };
