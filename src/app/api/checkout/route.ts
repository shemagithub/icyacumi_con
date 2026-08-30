import { getEventById } from "@/lib/marketplace";
import { getProductById } from "@/lib/products";
import { site } from "@/lib/site";
import type { CartLineKind, Product, Size } from "@/lib/types";

/**
 * Creates a Stripe Checkout Session.
 *
 * Prices are never taken from the request. The client sends identifiers
 * and quantities only; every amount is looked up server-side.
 */

const STRIPE_API = "https://api.stripe.com/v1/checkout/sessions";
const MAX_QUANTITY = 99;

interface RequestItem {
  productId: string;
  size: Size;
  color: string;
  quantity: number;
  kind?: CartLineKind;
}

interface ResolvedLine {
  product: Product;
  size: Size;
  color: string;
  quantity: number;
}

function badRequest(error: string) {
  return Response.json({ error }, { status: 400 });
}

function parseItems(payload: unknown): RequestItem[] | null {
  if (typeof payload !== "object" || payload === null) return null;
  const items = (payload as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) return null;

  const parsed: RequestItem[] = [];
  for (const raw of items) {
    if (typeof raw !== "object" || raw === null) return null;
    const item = raw as Record<string, unknown>;

    if (
      typeof item.productId !== "string" ||
      typeof item.size !== "string" ||
      typeof item.color !== "string" ||
      typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_QUANTITY
    ) {
      return null;
    }

    const kind =
      item.kind === "ticket" || item.color === "Ticket" ? "ticket" : "product";

    parsed.push({
      productId: item.productId,
      size: item.size as Size,
      color: item.color,
      quantity: item.quantity,
      kind,
    });
  }

  return parsed;
}

async function resolveLines(items: RequestItem[]): Promise<ResolvedLine[] | string> {
  const lines: ResolvedLine[] = [];

  for (const item of items) {
    if (item.kind === "ticket") {
      const event = await getEventById(item.productId);
      if (!event) return `One of the event tickets is no longer available.`;
      if (event.ticketsLeft <= 0) return `${event.title} is sold out.`;
      if (item.quantity > event.ticketsLeft) {
        return `Only ${event.ticketsLeft} tickets left for ${event.title}.`;
      }

      const ticketProduct: Product = {
        id: event.id,
        slug: event.slug,
        name: `${event.title} · ticket`,
        tagline: `${event.city} · ${event.date}`,
        description: event.summary,
        price: event.price,
        category: "accessories",
        collection: "bone-basics",
        colors: [{ name: "Ticket", hex: "#B5563A" }],
        sizes: ["OS"],
        images: [event.image],
        fabric: "-",
        fit: "-",
        details: [],
        inStock: true,
        stockQuantity: event.ticketsLeft,
        vendorId: event.vendorIds[0] ?? "v-bone",
        views: 0,
      };

      lines.push({
        product: ticketProduct,
        size: "OS",
        color: "Ticket",
        quantity: item.quantity,
      });
      continue;
    }

    const product = await getProductById(item.productId);
    if (!product) {
      return `A listing in your bag is a local demo upload · remove it or buy catalog / ticket items.`;
    }
    if (!product.inStock || product.stockQuantity <= 0) {
      return `${product.name} sold out while it sat in your bag.`;
    }
    const already = lines
      .filter((line) => line.product.id === product.id)
      .reduce((sum, line) => sum + line.quantity, 0);
    const left = product.stockQuantity - already;
    if (item.quantity > left) {
      return `Only ${Math.max(0, left)} left in stock for ${product.name}.`;
    }
    if (!product.sizes.includes(item.size)) {
      return `${product.name} isn't available in size ${item.size}.`;
    }
    if (!product.colors.some((color) => color.name === item.color)) {
      return `${product.name} isn't available in ${item.color}.`;
    }

    lines.push({
      product,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    });
  }

  return lines;
}

type CouponQuote = {
  discount: number;
  shipping: number;
  couponCode: string;
  couponId: string;
};

function chargedUnitsForLines(lines: ResolvedLine[], subtotal: number, discount: number) {
  if (discount <= 0 || subtotal <= 0) {
    return lines.map((line) => line.product.price);
  }
  const target = Math.max(0, subtotal - discount);
  let remaining = target;
  return lines.map((line, index) => {
    const lineTotal = line.product.price * line.quantity;
    if (index === lines.length - 1) {
      return Math.max(0, Math.floor(remaining / Math.max(1, line.quantity)));
    }
    const share = Math.floor((lineTotal * target) / subtotal);
    const unit = Math.max(0, Math.floor(share / Math.max(1, line.quantity)));
    remaining -= unit * line.quantity;
    return unit;
  });
}

/** Stripe's API is form-encoded, including for nested structures. */
function buildSessionParams(
  lines: ResolvedLine[],
  subtotal: number,
  customer?: CustomerPayload | null,
  extras?: { sharedCartToken?: string; coupon?: CouponQuote | null },
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${site.url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
  params.set(
    "cancel_url",
    extras?.sharedCartToken
      ? `${site.url}/pay/${extras.sharedCartToken}`
      : `${site.url}/checkout`,
  );
  params.set("shipping_address_collection[allowed_countries][0]", "US");
  params.set("shipping_address_collection[allowed_countries][1]", "CA");
  params.set("shipping_address_collection[allowed_countries][2]", "GB");
  params.set("shipping_address_collection[allowed_countries][3]", "RW");
  params.set("shipping_address_collection[allowed_countries][4]", "KE");
  params.set("shipping_address_collection[allowed_countries][5]", "NG");
  params.set("shipping_address_collection[allowed_countries][6]", "ZA");
  params.set("shipping_address_collection[allowed_countries][7]", "GH");

  if (customer?.email) {
    params.set("customer_email", customer.email);
  }

  if (customer?.name) {
    params.set("metadata[customer_name]", customer.name);
  }
  if (customer?.phone) {
    params.set("metadata[customer_phone]", customer.phone);
  }
  if (extras?.sharedCartToken) {
    params.set("metadata[shared_cart_token]", extras.sharedCartToken);
  }
  if (extras?.coupon?.couponCode) {
    params.set("metadata[coupon_code]", extras.coupon.couponCode);
    params.set("metadata[coupon_id]", extras.coupon.couponId);
    params.set("metadata[discount]", String(extras.coupon.discount));
  }
  if (customer?.line1) {
    params.set(
      "metadata[shipping_address]",
      [
        customer.line1,
        customer.line2,
        customer.city,
        customer.state,
        customer.postalCode,
        customer.country,
      ]
        .filter(Boolean)
        .join(", "),
    );
  }
  if (customer?.notes) {
    params.set("metadata[order_notes]", customer.notes.slice(0, 450));
  }

  // Stripe fetches product images over the public internet, so skip them locally.
  const imagesAreReachable = !site.url.includes("localhost");
  const discount = extras?.coupon?.discount ?? 0;
  const unitAmounts = chargedUnitsForLines(lines, subtotal, discount);

  lines.forEach((line, index) => {
    const prefix = `line_items[${index}]`;
    params.set(`${prefix}[quantity]`, String(line.quantity));
    params.set(`${prefix}[price_data][currency]`, site.currency.toLowerCase());
    params.set(`${prefix}[price_data][unit_amount]`, String(unitAmounts[index] ?? line.product.price));
    params.set(`${prefix}[price_data][product_data][name]`, line.product.name);
    params.set(
      `${prefix}[price_data][product_data][description]`,
      `${line.color} / ${line.size}`,
    );
    params.set(
      `${prefix}[price_data][product_data][metadata][sku]`,
      `${line.product.id}-${line.size}-${line.color}`,
    );
    params.set(
      `${prefix}[price_data][product_data][metadata][product_id]`,
      line.product.id,
    );
    params.set(
      `${prefix}[price_data][product_data][metadata][brand_id]`,
      line.product.vendorId,
    );
    params.set(
      `${prefix}[price_data][product_data][metadata][kind]`,
      line.color === "Ticket" ? "ticket" : "product",
    );
    if (line.product.brandName) {
      params.set(
        `${prefix}[price_data][product_data][metadata][brand_name]`,
        line.product.brandName,
      );
    }
    if (imagesAreReachable) {
      params.set(
        `${prefix}[price_data][product_data][images][0]`,
        `${site.url}${line.product.images[0].src}`,
      );
    }
  });

  const shipping =
    extras?.coupon != null
      ? extras.coupon.shipping
      : subtotal >= site.freeShippingThreshold
        ? 0
        : site.shippingRate;
  const rate = "shipping_options[0][shipping_rate_data]";
  params.set(`${rate}[type]`, "fixed_amount");
  params.set(`${rate}[fixed_amount][amount]`, String(shipping));
  params.set(`${rate}[fixed_amount][currency]`, site.currency.toLowerCase());
  params.set(
    `${rate}[display_name]`,
    shipping === 0 ? "Free shipping" : "Standard shipping",
  );

  return params;
}

interface CustomerPayload {
  email?: string;
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
}

function parseCustomer(payload: unknown): CustomerPayload | null {
  if (typeof payload !== "object" || payload === null) return null;
  const customer = (payload as { customer?: unknown }).customer;
  if (typeof customer !== "object" || customer === null) return null;

  const raw = customer as Record<string, unknown>;
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  if (!email || !email.includes("@")) return null;

  return {
    email,
    name: typeof raw.name === "string" ? raw.name.trim() : undefined,
    phone: typeof raw.phone === "string" ? raw.phone.trim() : undefined,
    line1: typeof raw.line1 === "string" ? raw.line1.trim() : undefined,
    line2: typeof raw.line2 === "string" ? raw.line2.trim() : undefined,
    city: typeof raw.city === "string" ? raw.city.trim() : undefined,
    state: typeof raw.state === "string" ? raw.state.trim() : undefined,
    postalCode: typeof raw.postalCode === "string" ? raw.postalCode.trim() : undefined,
    country: typeof raw.country === "string" ? raw.country.trim() : undefined,
    notes: typeof raw.notes === "string" ? raw.notes.trim() : undefined,
  };
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return badRequest("Malformed request.");
  }

  const items = parseItems(payload);
  if (!items) return badRequest("Your bag couldn't be read. Try refreshing the page.");

  const customer = parseCustomer(payload);
  const sharedCartToken =
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as { sharedCartToken?: unknown }).sharedCartToken === "string"
      ? (payload as { sharedCartToken: string }).sharedCartToken.trim()
      : undefined;

  const resolved = await resolveLines(items);
  if (typeof resolved === "string") return badRequest(resolved);

  const subtotal = resolved.reduce(
    (total, line) => total + line.product.price * line.quantity,
    0,
  );

  const couponCode =
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as { couponCode?: unknown }).couponCode === "string"
      ? (payload as { couponCode: string }).couponCode.trim()
      : "";

  let coupon: CouponQuote | null = null;
  if (couponCode) {
    const backendUrl =
      process.env.BACKEND_URL ??
      process.env.NEXT_PUBLIC_BACKEND_URL ??
      "http://localhost:4000";
    const quoteRes = await fetch(`${backendUrl}/api/catalog/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: couponCode,
        items: items.map((item) => ({
          productId: item.productId,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          kind: item.kind,
        })),
      }),
    });
    const quote = (await quoteRes.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      discount?: number;
      shipping?: number;
      coupon?: { code?: string; id?: string };
    };
    if (!quoteRes.ok || !quote.ok || !quote.coupon?.code || !quote.coupon?.id) {
      return badRequest(quote.error ?? "Coupon could not be applied.");
    }
    coupon = {
      discount: Math.max(0, Math.round(Number(quote.discount) || 0)),
      shipping: Math.max(0, Math.round(Number(quote.shipping) || 0)),
      couponCode: quote.coupon.code,
      couponId: quote.coupon.id,
    };
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return Response.json(
      {
        error:
          "Card payments aren’t connected. You can still confirm this order below for tracking.",
        demoAvailable: true,
      },
      { status: 503 },
    );
  }

  const response = await fetch(STRIPE_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: buildSessionParams(resolved, subtotal, customer, {
      sharedCartToken: sharedCartToken || undefined,
      coupon,
    }),
  });

  const session: { url?: string; error?: { message?: string } } = await response.json();

  if (!response.ok || !session.url) {
    console.error("Stripe checkout session failed", session.error);
    return Response.json(
      { error: "We couldn't start checkout. Please try again." },
      { status: 502 },
    );
  }

  return Response.json({ url: session.url });
}
