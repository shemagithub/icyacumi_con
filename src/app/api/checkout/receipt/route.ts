/**
 * After Stripe Checkout succeeds, fetch the session and ask the backend
 * to email the buyer receipt + brand sale notices, and persist the order.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const sessionId =
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as { sessionId?: unknown }).sessionId === "string"
      ? (payload as { sessionId: string }).sessionId.trim()
      : "";

  if (!sessionId) {
    return Response.json({ error: "Missing session id." }, { status: 400 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return Response.json(
      { error: "Payments aren’t connected.", skipped: true },
      { status: 503 },
    );
  }

  const sessionRes = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=line_items.data.price.product`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
    },
  );

  const session = (await sessionRes.json()) as {
    id?: string;
    payment_status?: string;
    amount_total?: number;
    customer_details?: { email?: string; name?: string; phone?: string };
    customer_email?: string;
    metadata?: Record<string, string>;
    shipping_details?: { address?: Record<string, string | null> };
    shipping_cost?: { amount_total?: number };
    line_items?: {
      data?: Array<{
        description?: string;
        quantity?: number;
        amount_total?: number;
        price?: {
          unit_amount?: number;
          product?:
            | string
            | {
                name?: string;
                description?: string;
                metadata?: Record<string, string>;
              };
        };
      }>;
    };
    error?: { message?: string };
  };

  if (!sessionRes.ok || !session.id) {
    return Response.json(
      { error: session.error?.message ?? "Could not load checkout session." },
      { status: 502 },
    );
  }

  if (session.payment_status && session.payment_status !== "paid") {
    return Response.json({ error: "Payment not completed yet." }, { status: 409 });
  }

  const email =
    session.customer_details?.email || session.customer_email || "";
  if (!email.includes("@")) {
    return Response.json({ error: "No customer email on session." }, { status: 400 });
  }

  const lines = (session.line_items?.data ?? []).map((item) => {
    const product =
      item.price?.product && typeof item.price.product === "object"
        ? item.price.product
        : null;
    const quantity = item.quantity ?? 1;
    const unitAmount =
      item.price?.unit_amount ??
      Math.round((item.amount_total ?? 0) / Math.max(1, quantity));

    return {
      name: product?.name ?? item.description ?? "Item",
      quantity,
      unitAmount,
      brandId: product?.metadata?.brand_id,
      brandName: product?.metadata?.brand_name,
      productId: product?.metadata?.product_id,
      kind: product?.metadata?.kind,
      meta: product?.description ?? item.description,
    };
  });

  const shippingAddress = formatAddress(session.shipping_details?.address);
  const backendUrl =
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    "http://localhost:4000";

  const notifyRes = await fetch(`${backendUrl}/api/catalog/order-receipt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      customerName:
        session.customer_details?.name ||
        session.metadata?.customer_name ||
        undefined,
      phone:
        session.customer_details?.phone ||
        session.metadata?.customer_phone ||
        undefined,
      reference: session.id.slice(-12).toUpperCase(),
      stripeSessionId: session.id,
      sharedCartToken: session.metadata?.shared_cart_token || undefined,
      lines,
      shipping: session.shipping_cost?.amount_total ?? 0,
      discount: Number(session.metadata?.discount ?? 0) || 0,
      couponCode: session.metadata?.coupon_code || undefined,
      couponId: session.metadata?.coupon_id || undefined,
      total: session.amount_total ?? 0,
      shippingAddress:
        shippingAddress || session.metadata?.shipping_address || undefined,
    }),
  });

  const data = (await notifyRes.json().catch(() => ({}))) as {
    error?: string;
    order?: { reference?: string };
  };

  if (!notifyRes.ok) {
    return Response.json(
      { error: data.error ?? "Could not send receipt email." },
      { status: 502 },
    );
  }

  return Response.json({
    ok: true,
    order: data.order ?? null,
    reference: data.order?.reference ?? null,
  });
}

function formatAddress(address?: Record<string, string | null>) {
  if (!address) return "";
  return [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}
