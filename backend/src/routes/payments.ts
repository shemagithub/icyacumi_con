import { Router } from "express";
import type { Prisma } from "../generated/prisma/client.js";
import { AUTH_COOKIE, readAuthFromCookie } from "../lib/auth.js";
import {
  createPaidOrder,
  isUniqueConstraint,
  mapPaidOrder,
  normalizePaymentMethod,
  parseCheckoutCustomer,
  prepareCheckout,
  type PreparedCheckout,
} from "../lib/checkout-order.js";
import { prisma } from "../lib/db.js";
import { makeToken } from "../lib/orders.js";
import {
  getCollectionStatus,
  initiateCollection,
  isXentriPayConfigured,
  retcodeMessage,
  rwandaCollectionPhones,
  XENTRIPAY_MIN_AMOUNT,
  type XentriPayPMethod,
} from "../lib/xentripay.js";

export const paymentsRouter = Router();

function makeCustomerRef() {
  const stamp = Date.now().toString(36).toUpperCase();
  return `ICY-${stamp}-${makeToken(4).toUpperCase()}`;
}

function frontendOrigin() {
  return (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function paymentReturnUrl(customerRef: string) {
  return `${frontendOrigin()}/checkout/pay/return?ref=${encodeURIComponent(customerRef)}`;
}

type StoredPayload = {
  items?: Array<Record<string, unknown>>;
  sharedCartToken?: string;
  couponCode?: string;
  customer: PreparedCheckout["customer"];
  paymentMethod: PreparedCheckout["paymentMethod"];
  clientId?: string | null;
};

async function clientIdFromRequest(req: { cookies?: Record<string, string> }) {
  const authToken = req.cookies?.[AUTH_COOKIE] as string | undefined;
  const session = await readAuthFromCookie(authToken);
  return session?.type === "client" ? session.userId : null;
}

function sessionPublic(row: {
  customerRef: string;
  status: string;
  pmethod: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  refid: string | null;
  errorMessage: string | null;
}) {
  return {
    customerRef: row.customerRef,
    status: row.status,
    pmethod: row.pmethod,
    paymentMethod: row.paymentMethod,
    amount: row.amount,
    currency: row.currency,
    refid: row.refid,
    error: row.errorMessage,
  };
}

async function fulfillIfSuccess(row: {
  id: string;
  customerRef: string;
  status: string;
  orderId: string | null;
  payload: Prisma.JsonValue;
}) {
  if (row.orderId) {
    const existing = await prisma.order.findUnique({
      where: { id: row.orderId },
      include: { items: true },
    });
    if (existing) return existing;
  }

  const payload = row.payload as StoredPayload;
  let prepared = await prepareCheckout({
    rawItems: payload.items,
    sharedCartToken: payload.sharedCartToken,
    couponCode: payload.couponCode,
    customer: payload.customer,
    paymentMethod: payload.paymentMethod,
    ignoreStock: true,
  });
  if ("error" in prepared && payload.items?.length) {
    prepared = await prepareCheckout({
      rawItems: payload.items,
      couponCode: payload.couponCode,
      customer: payload.customer,
      paymentMethod: payload.paymentMethod,
      ignoreStock: true,
    });
  }
  if ("error" in prepared) {
    const existing = await prisma.order.findUnique({
      where: { stripeSessionId: row.customerRef },
      include: { items: true },
    });
    if (existing) return existing;
    throw new Error(prepared.error);
  }

  let order;
  try {
    order = await createPaidOrder({
      prepared,
      clientId: payload.clientId ?? null,
      stripeSessionId: row.customerRef,
    });
  } catch (error) {
    if (!isUniqueConstraint(error)) throw error;
    order = await prisma.order.findUnique({
      where: { stripeSessionId: row.customerRef },
      include: { items: true },
    });
    if (!order) throw error;
  }

  await prisma.paymentSession.update({
    where: { id: row.id },
    data: {
      status: "SUCCESS",
      orderId: order.id,
      errorMessage: null,
    },
  });

  return order;
}

async function syncPaymentSession(customerRef: string) {
  const row = await prisma.paymentSession.findUnique({
    where: { customerRef },
  });
  if (!row) return null;

  if (row.status === "SUCCESS" && row.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: row.orderId },
      include: { items: true },
    });
    return { row, order };
  }

  if (row.status === "FAILED") {
    return { row, order: null };
  }

  if (row.amount === 0) {
    const order = await fulfillIfSuccess(row);
    const updated = await prisma.paymentSession.findUnique({
      where: { id: row.id },
    });
    return { row: updated ?? row, order };
  }

  const remote = await getCollectionStatus(row.customerRef);
  const status = String(remote.status ?? "PENDING").toUpperCase();

  if (status === "SUCCESS") {
    const order = await fulfillIfSuccess(row);
    const updated = await prisma.paymentSession.findUnique({
      where: { id: row.id },
    });
    return { row: updated ?? { ...row, status: "SUCCESS" }, order };
  }

  if (status === "FAILED") {
    const updated = await prisma.paymentSession.update({
      where: { id: row.id },
      data: {
        status: "FAILED",
        errorMessage: remote.message || "Payment failed or was cancelled.",
      },
    });
    return { row: updated, order: null };
  }

  if (remote.message && remote.message !== row.errorMessage) {
    const updated = await prisma.paymentSession.update({
      where: { id: row.id },
      data: { errorMessage: remote.message },
    });
    return { row: updated, order: null };
  }

  return { row, order: null };
}

paymentsRouter.get("/payments/ready", (_req, res) => {
  const configured = isXentriPayConfigured();
  res.json({
    ok: configured,
    provider: "xentripay",
    configured,
    currency: "RWF",
    minAmount: XENTRIPAY_MIN_AMOUNT,
    methods: ["mtn", "airtel", "card"],
    message: configured
      ? "XentriPay collections are ready."
      : "Add XENTRIPAY_API_KEY in backend/.env to accept live MoMo and card payments.",
  });
});

paymentsRouter.post("/payments/initiate", async (req, res) => {
  try {
    const customerParsed = parseCheckoutCustomer(req.body?.customer);
    if (typeof customerParsed === "string") {
      res.status(400).json({ error: customerParsed });
      return;
    }

    const paymentMethod = normalizePaymentMethod(req.body?.paymentMethod);
    const pmethod: XentriPayPMethod = paymentMethod === "card" ? "cc" : "momo";
    const phone = String(req.body?.customer?.phone ?? customerParsed.phone ?? "").trim();
    const phones = rwandaCollectionPhones(phone);

    if (!phones) {
      res.status(400).json({
        error:
          paymentMethod === "card"
            ? "Card pay needs a Rwanda contact phone (07xxxxxxxx)."
            : "Enter a valid Rwanda mobile money number (07xxxxxxxx).",
      });
      return;
    }

    const customer = { ...customerParsed, phone: phones.cnumber };
    const prepared = await prepareCheckout({
      rawItems: Array.isArray(req.body?.items) ? req.body.items : [],
      sharedCartToken: String(req.body?.sharedCartToken ?? "").trim() || undefined,
      couponCode: String(req.body?.couponCode ?? "").trim() || undefined,
      customer,
      paymentMethod,
    });
    if ("error" in prepared) {
      res.status(prepared.status).json({ error: prepared.error });
      return;
    }

    if (prepared.total > 0 && prepared.total < XENTRIPAY_MIN_AMOUNT) {
      res.status(400).json({
        error: `XentriPay collections require at least ${XENTRIPAY_MIN_AMOUNT} RWF.`,
      });
      return;
    }

    const clientId = await clientIdFromRequest(req);
    const customerRef = makeCustomerRef();
    const payload: StoredPayload = {
      items: Array.isArray(req.body?.items)
        ? (req.body.items as Array<Record<string, unknown>>)
        : undefined,
      sharedCartToken: prepared.shared?.token,
      couponCode: prepared.couponCode ?? undefined,
      customer,
      paymentMethod,
      clientId,
    };

    const session = await prisma.paymentSession.create({
      data: {
        customerRef,
        status: "PENDING",
        pmethod,
        paymentMethod,
        amount: prepared.total,
        currency: "RWF",
        payload: payload as Prisma.InputJsonValue,
      },
    });

    if (prepared.total === 0) {
      const order = await fulfillIfSuccess(session);
      res.status(201).json({
        ...sessionPublic({ ...session, status: "SUCCESS" }),
        status: "SUCCESS",
        redirectUrl: null,
        order: mapPaidOrder(order),
      });
      return;
    }

    if (!isXentriPayConfigured()) {
      await prisma.paymentSession.update({
        where: { id: session.id },
        data: {
          status: "FAILED",
          errorMessage: "XentriPay is not configured.",
        },
      });
      res.status(503).json({
        error:
          "Live payments are not connected. Add XENTRIPAY_API_KEY to backend/.env (test key from the XentriPay merchant dashboard).",
      });
      return;
    }

    const returnUrl = paymentReturnUrl(customerRef);
    const initiated = await initiateCollection({
      email: customer.email,
      cname: customer.name,
      amount: prepared.total,
      cnumber: phones.cnumber,
      msisdn: phones.msisdn,
      pmethod,
      customerRef,
      chargesIncluded: true,
      redirecturl: returnUrl,
      returl: returnUrl,
      details: `ICYACUMI ${customerRef}`,
    });

    if (!initiated.success) {
      await prisma.paymentSession.update({
        where: { id: session.id },
        data: {
          status: "FAILED",
          refid: initiated.refid?.trim() || undefined,
          tid: initiated.tid?.trim() || undefined,
          errorMessage: initiated.message || retcodeMessage(initiated.retcode),
        },
      });
      res.status(402).json({
        error: initiated.message || retcodeMessage(initiated.retcode),
        customerRef,
        retcode: initiated.retcode,
      });
      return;
    }

    const updated = await prisma.paymentSession.update({
      where: { id: session.id },
      data: {
        refid: initiated.refid?.trim() || undefined,
        tid: initiated.tid?.trim() || undefined,
      },
    });

    res.status(201).json({
      ...sessionPublic(updated),
      redirectUrl: pmethod === "cc" ? initiated.url ?? null : null,
      reply: initiated.reply,
    });
  } catch (error) {
    console.error("[payments/initiate]", error);
    res.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not start payment. Try again shortly.",
    });
  }
});

paymentsRouter.get("/payments/status/:ref", async (req, res) => {
  const customerRef = String(req.params.ref ?? "").trim();
  if (!customerRef) {
    res.status(400).json({ error: "Missing payment reference." });
    return;
  }

  try {
    const synced = await syncPaymentSession(customerRef);
    if (!synced) {
      res.status(404).json({ error: "Payment not found." });
      return;
    }

    res.json({
      ...sessionPublic(synced.row),
      order: synced.order ? mapPaidOrder(synced.order) : null,
    });
  } catch (error) {
    console.error("[payments/status]", error);
    res.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not check payment status.",
    });
  }
});

async function handlePaymentCallback(
  req: { query: Record<string, unknown>; body?: Record<string, unknown> },
  res: { redirect: (status: number, url: string) => void; status: (n: number) => { json: (v: unknown) => void } },
) {
  const customerRef = String(
    req.query.ref ?? req.query.customerRef ?? req.body?.ref ?? req.body?.customerRef ?? "",
  ).trim();
  if (!customerRef) {
    res.status(400).json({ error: "Missing payment reference." });
    return;
  }

  try {
    await syncPaymentSession(customerRef);
  } catch (error) {
    console.error("[payments/callback]", error);
  }

  res.redirect(302, paymentReturnUrl(customerRef));
}

paymentsRouter.get("/payments/callback", (req, res) => {
  void handlePaymentCallback(req, res);
});

paymentsRouter.post("/payments/callback", (req, res) => {
  void handlePaymentCallback(req, res);
});
