/** Client-side draft between checkout address step and payment method step. */

export type CheckoutDraftCustomer = {
  email: string;
  name: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  notes?: string;
};

export type CheckoutDraftItem = {
  productId: string;
  size: string;
  color: string;
  quantity: number;
  kind: "product" | "ticket";
  name?: string;
  price?: number;
  slug?: string;
  imageSrc?: string;
};

export type AppliedCoupon = {
  code: string;
  couponId: string;
  type: string;
  discount: number;
  shipping: number;
  total: number;
  freeShipping: boolean;
  description?: string | null;
};

export type CheckoutDraft = {
  customer: CheckoutDraftCustomer;
  items: CheckoutDraftItem[];
  sharedCartToken?: string;
  giftNote?: string | null;
  ownerName?: string | null;
  acceptedTerms: boolean;
  coupon?: AppliedCoupon | null;
  /** True when checkout started from Buy now (leave bag untouched). */
  buyNow?: boolean;
  createdAt: number;
};

export const CHECKOUT_DRAFT_KEY = "bone-checkout-draft";

export type PaymentMethodId = "mtn" | "airtel" | "card";

export const PAYMENT_METHODS: Array<{
  id: PaymentMethodId;
  label: string;
  description: string;
  needsPhone: boolean;
}> = [
  {
    id: "mtn",
    label: "MTN MoMo",
    description: "Pay with MTN Mobile Money via XentriPay. Approve the prompt on your phone.",
    needsPhone: true,
  },
  {
    id: "airtel",
    label: "Airtel Money",
    description: "Pay with Airtel Money via XentriPay. Approve the prompt on your phone.",
    needsPhone: true,
  },
  {
    id: "card",
    label: "Card",
    description: "Visa and Mastercard on XentriPay’s secure card page.",
    needsPhone: true,
  },
];

export function saveCheckoutDraft(draft: CheckoutDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
}

export function readCheckoutDraft(): CheckoutDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CheckoutDraft;
    if (!data?.customer?.email || !Array.isArray(data.items) || data.items.length === 0) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearCheckoutDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
}

export const PAYMENT_REF_KEY = "bone-xentripay-ref";

export function savePaymentRef(customerRef: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PAYMENT_REF_KEY, customerRef);
}

export function readPaymentRef() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PAYMENT_REF_KEY);
}

export function clearPaymentRef() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PAYMENT_REF_KEY);
}

export function paymentMethodLabel(id: PaymentMethodId | string) {
  return PAYMENT_METHODS.find((method) => method.id === id)?.label ?? id;
}
