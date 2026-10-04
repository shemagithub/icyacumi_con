import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST ?? "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = (process.env.SMTP_PASS ?? "").replace(/\s+/g, "");
const MAIL_FROM =
  process.env.MAIL_FROM ??
  (SMTP_USER ? `ICYACUMI <${SMTP_USER}>` : "ICYACUMI <noreply@icyacumi.com>");
export const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL ?? SMTP_USER;
export const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!SMTP_USER || !SMTP_PASS) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      tls: { servername: SMTP_HOST },
    });
  }
  return transporter;
}

export function isMailConfigured() {
  return Boolean(SMTP_USER && SMTP_PASS);
}

export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type SendMailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: MailAttachment[];
};

export async function sendMail(input: SendMailInput): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const transport = getTransporter();
  if (!transport) {
    console.warn("[mail] SMTP not configured · skipped:", input.subject, "→", input.to);
    return { ok: false, skipped: true, error: "SMTP not configured" };
  }

  try {
    await transport.sendMail({
      from: MAIL_FROM,
      to: Array.isArray(input.to) ? input.to.join(", ") : input.to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? stripHtml(input.html),
      replyTo: input.replyTo,
      attachments: input.attachments?.map((file) => ({
        filename: file.filename,
        content: file.content,
        contentType: file.contentType ?? "application/octet-stream",
      })),
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    console.error("[mail] Failed:", message);
    return { ok: false, error: message };
  }
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f5f1ea;font-family:Georgia,serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f1ea;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#fffdf8;border:1px solid #d0c2ae;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#1a1a1a;padding:20px 28px;">
          <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#e8b82e;">MADE IN AFREEKA</p>
          <p style="margin:8px 0 0;font-size:22px;letter-spacing:0.08em;color:#fffdf8;">ICYACUMI</p>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:normal;">${escapeHtml(title)}</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px solid #d0c2ae;font-size:12px;color:#6b5e4e;">
          You’re receiving this because of activity on ICYACUMI.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatRwf(amount: number) {
  return `RF ${Math.round(amount).toLocaleString("en-US")}`;
}

export async function sendVerificationCodeEmail(opts: {
  to: string;
  name: string;
  code: string;
}) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?email=${encodeURIComponent(opts.to)}`;
  return sendMail({
    to: opts.to,
    subject: `${opts.code} is your ICYACUMI verification code`,
    html: layout(
      "Verify your email",
      `<p style="margin:0 0 12px;line-height:1.5;">Hi ${escapeHtml(opts.name)},</p>
       <p style="margin:0 0 16px;line-height:1.5;">Use this code to verify your account:</p>
       <p style="margin:0 0 20px;font-size:32px;letter-spacing:0.35em;font-weight:bold;">${escapeHtml(opts.code)}</p>
       <p style="margin:0 0 16px;line-height:1.5;font-size:14px;color:#6b5e4e;">Code expires in 30 minutes.</p>
       <p style="margin:0;"><a href="${verifyUrl}" style="color:#b5563a;">Open verification page</a></p>`,
    ),
  });
}

export async function sendWelcomeEmail(opts: { to: string; name: string }) {
  return sendMail({
    to: opts.to,
    subject: "Welcome to ICYACUMI",
    html: layout(
      "Welcome",
      `<p style="margin:0 0 12px;line-height:1.5;">Hi ${escapeHtml(opts.name)},</p>
       <p style="margin:0 0 16px;line-height:1.5;">Your client account is ready. Shop products, book event tickets, and checkout in one place.</p>
       <p style="margin:0;"><a href="${FRONTEND_URL}/shop" style="display:inline-block;background:#b5563a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">Start shopping</a></p>`,
    ),
  });
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  code: string;
}) {
  const resetUrl = `${FRONTEND_URL}/reset-password?email=${encodeURIComponent(opts.to)}`;
  return sendMail({
    to: opts.to,
    subject: `${opts.code} is your ICYACUMI password reset code`,
    html: layout(
      "Reset your password",
      `<p style="margin:0 0 12px;line-height:1.5;">Hi ${escapeHtml(opts.name)},</p>
       <p style="margin:0 0 16px;line-height:1.5;">Use this code to choose a new password:</p>
       <p style="margin:0 0 20px;font-size:32px;letter-spacing:0.35em;font-weight:bold;">${escapeHtml(opts.code)}</p>
       <p style="margin:0 0 16px;line-height:1.5;font-size:14px;color:#6b5e4e;">Code expires in 30 minutes. If you didn’t ask for this, ignore this email.</p>
       <p style="margin:0;"><a href="${resetUrl}" style="color:#b5563a;">Open reset page</a></p>`,
    ),
  });
}

export async function sendBrandInviteEmail(opts: {
  to: string;
  name: string;
  brandName: string;
  password: string;
}) {
  return sendMail({
    to: opts.to,
    subject: `Your ${opts.brandName} brand portal on ICYACUMI`,
    html: layout(
      "Brand portal access",
      `<p style="margin:0 0 12px;line-height:1.5;">Hi ${escapeHtml(opts.name)},</p>
       <p style="margin:0 0 16px;line-height:1.5;"><strong>${escapeHtml(opts.brandName)}</strong> is live on ICYACUMI. Sign in to manage products, ads, and payouts. Ticketed events are published by the platform admin.</p>
       <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(opts.to)}</p>
       <p style="margin:0 0 20px;"><strong>Temporary password:</strong> ${escapeHtml(opts.password)}</p>
       <p style="margin:0;"><a href="${FRONTEND_URL}/login?next=/portal" style="display:inline-block;background:#b5563a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">Open portal</a></p>`,
    ),
  });
}

/** Ops alert when a brand self-registers. */
export async function sendBrandSignupNotify(opts: {
  brandName: string;
  slug: string;
  location: string;
  ownerName: string;
  ownerEmail: string;
  contactPhone?: string | null;
  applicationNote?: string | null;
  hasKyc?: boolean;
}) {
  const to = NOTIFY_EMAIL || SMTP_USER;
  if (!to) return { ok: false as const, error: "No notify address" };
  const note = opts.applicationNote
    ? `<p style="margin:12px 0 0;"><strong>About:</strong> ${escapeHtml(opts.applicationNote)}</p>`
    : "";
  const phone = opts.contactPhone
    ? `<p style="margin:0 0 8px;"><strong>Phone:</strong> ${escapeHtml(opts.contactPhone)}</p>`
    : "";
  const kyc = opts.hasKyc
    ? `<p style="margin:12px 0 0;"><strong>KYC:</strong> National ID + RDB certificate uploaded · review in Admin → Brands.</p>`
    : `<p style="margin:12px 0 0;color:#b5563a;"><strong>KYC missing</strong> · ask the brand to re-apply with documents.</p>`;
  return sendMail({
    to,
    subject: `Brand approval needed: ${opts.brandName}`,
    html: layout(
      "New brand application",
      `<p style="margin:0 0 12px;line-height:1.5;"><strong>${escapeHtml(opts.brandName)}</strong> applied for a portal. Approve them in Admin → Brands before they can sell.</p>
       <p style="margin:0 0 8px;"><strong>Slug:</strong> /brands/${escapeHtml(opts.slug)}</p>
       <p style="margin:0 0 8px;"><strong>Location:</strong> ${escapeHtml(opts.location)}</p>
       <p style="margin:0 0 8px;"><strong>Owner:</strong> ${escapeHtml(opts.ownerName)}</p>
       <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(opts.ownerEmail)}</p>
       ${phone}
       ${note}
       ${kyc}
       <p style="margin:20px 0 0;"><a href="${FRONTEND_URL}/admin/brands" style="color:#b5563a;">Review in admin</a></p>`,
    ),
  });
}

export async function sendBrandApprovedEmail(opts: {
  to: string;
  ownerName: string;
  brandName: string;
}) {
  return sendMail({
    to: opts.to,
    subject: `${opts.brandName} is approved · open your portal`,
    html: layout(
      "Brand approved",
      `<p style="margin:0 0 12px;line-height:1.5;">Hi ${escapeHtml(opts.ownerName)}, <strong>${escapeHtml(opts.brandName)}</strong> is approved on ICYACUMI.</p>
       <p style="margin:0 0 16px;">You can log in and start listing products, ads, and managing sales.</p>
       <p style="margin:0;"><a href="${FRONTEND_URL}/login?next=/portal" style="color:#b5563a;">Open brand portal</a></p>`,
    ),
  });
}

export async function sendBrandRejectedEmail(opts: {
  to: string;
  ownerName: string;
  brandName: string;
  reason?: string | null;
}) {
  const reason = opts.reason
    ? `<p style="margin:12px 0 0;"><strong>Note:</strong> ${escapeHtml(opts.reason)}</p>`
    : "";
  return sendMail({
    to: opts.to,
    subject: `${opts.brandName} application update`,
    html: layout(
      "Application update",
      `<p style="margin:0 0 12px;line-height:1.5;">Hi ${escapeHtml(opts.ownerName)}, we could not approve <strong>${escapeHtml(opts.brandName)}</strong> for the marketplace at this time.</p>
       ${reason}
       <p style="margin:16px 0 0;">Questions? Reply to this email or write us from the contact page.</p>`,
    ),
  });
}

export type ReceiptLine = {
  name: string;
  quantity: number;
  unitAmount: number;
  brandName?: string;
  meta?: string;
};

export async function sendOrderReceiptEmail(opts: {
  to: string;
  customerName?: string;
  reference: string;
  lines: ReceiptLine[];
  shipping?: number;
  discount?: number;
  couponCode?: string | null;
  total: number;
  shippingAddress?: string;
  paymentMethod?: string | null;
  paidAt?: Date | string | null;
}) {
  const rows = opts.lines
    .map(
      (line) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">
            ${escapeHtml(line.name)}
            ${line.brandName ? `<br/><span style="font-size:12px;color:#6b5e4e;">${escapeHtml(line.brandName)}</span>` : ""}
            ${line.meta ? `<br/><span style="font-size:12px;color:#6b5e4e;">${escapeHtml(line.meta)}</span>` : ""}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${line.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatRwf(line.unitAmount * line.quantity)}</td>
        </tr>`,
    )
    .join("");

  const { buildOrderReceiptPdf } = await import("./receipt-pdf.js");
  let pdf: Buffer | null = null;
  try {
    pdf = await buildOrderReceiptPdf({
      reference: opts.reference,
      customerName: opts.customerName,
      email: opts.to,
      lines: opts.lines,
      shipping: opts.shipping,
      discount: opts.discount,
      couponCode: opts.couponCode,
      total: opts.total,
      shippingAddress: opts.shippingAddress,
      paymentMethod: opts.paymentMethod,
      paidAt: opts.paidAt,
    });
  } catch (error) {
    console.error(
      "[mail] Receipt PDF failed:",
      error instanceof Error ? error.message : error,
    );
  }

  const safeRef = opts.reference.replace(/[^a-zA-Z0-9_-]+/g, "-");
  const discount = Math.max(0, Math.round(opts.discount ?? 0));

  return sendMail({
    to: opts.to,
    subject: `Order receipt · ${opts.reference}`,
    html: layout(
      "Your order receipt",
      `<p style="margin:0 0 12px;line-height:1.5;">Hi ${escapeHtml(opts.customerName || "there")},</p>
       <p style="margin:0 0 16px;line-height:1.5;">Thanks for shopping on ICYACUMI. Your payment was successful · here’s your receipt${pdf ? " (PDF attached)" : ""}.</p>
       <p style="margin:0 0 16px;font-size:13px;color:#6b5e4e;">Reference: ${escapeHtml(opts.reference)}</p>
       <table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
         <tr>
           <th align="left" style="padding-bottom:8px;border-bottom:2px solid #1a1a1a;">Item</th>
           <th style="padding-bottom:8px;border-bottom:2px solid #1a1a1a;">Qty</th>
           <th align="right" style="padding-bottom:8px;border-bottom:2px solid #1a1a1a;">Amount</th>
         </tr>
         ${rows}
       </table>
       ${
         discount > 0
           ? `<p style="margin:16px 0 0;text-align:right;">Discount${opts.couponCode ? ` (${escapeHtml(opts.couponCode)})` : ""}: −${formatRwf(discount)}</p>`
           : ""
       }
       ${
         typeof opts.shipping === "number"
           ? `<p style="margin:8px 0 0;text-align:right;">Shipping: ${formatRwf(opts.shipping)}</p>`
           : ""
       }
       <p style="margin:8px 0 0;text-align:right;font-size:18px;"><strong>Total: ${formatRwf(opts.total)}</strong></p>
       ${
         opts.shippingAddress
           ? `<p style="margin:20px 0 0;font-size:13px;color:#6b5e4e;"><strong>Ship to:</strong><br/>${escapeHtml(opts.shippingAddress)}</p>`
           : ""
       }
       ${
         pdf
           ? `<p style="margin:20px 0 0;font-size:13px;color:#6b5e4e;">A PDF copy of this receipt is attached to this email.</p>`
           : ""
       }
       <p style="margin:24px 0 0;"><a href="${FRONTEND_URL}/account" style="color:#b5563a;">View your account</a></p>`,
    ),
    attachments: pdf
      ? [
          {
            filename: `ICYACUMI-receipt-${safeRef}.pdf`,
            content: pdf,
            contentType: "application/pdf",
          },
        ]
      : undefined,
  });
}

export async function sendBrandSaleEmail(opts: {
  to: string | string[];
  brandName: string;
  customerName?: string;
  customerEmail?: string;
  reference: string;
  paymentMethod?: string;
  shippingAddress?: string;
  lines: ReceiptLine[];
  total: number;
}) {
  const rows = opts.lines
    .map(
      (line) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(line.name)}${line.meta ? `<br/><span style="font-size:12px;color:#6b5e4e;">${escapeHtml(line.meta)}</span>` : ""}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${line.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatRwf(line.unitAmount * line.quantity)}</td>
        </tr>`,
    )
    .join("");

  const payment =
    opts.paymentMethod
      ? `<p style="margin:0 0 8px;font-size:13px;color:#6b5e4e;">Payment: ${escapeHtml(opts.paymentMethod)}</p>`
      : "";
  const ship =
    opts.shippingAddress
      ? `<p style="margin:0 0 8px;font-size:13px;color:#6b5e4e;">Ship to: ${escapeHtml(opts.shippingAddress)}</p>`
      : "";
  const buyerEmail =
    opts.customerEmail
      ? `<p style="margin:0 0 8px;font-size:13px;color:#6b5e4e;">Buyer email: ${escapeHtml(opts.customerEmail)}</p>`
      : "";

  return sendMail({
    to: opts.to,
    subject: `New sale for ${opts.brandName} · ${opts.reference}`,
    html: layout(
      "You made a sale",
      `<p style="margin:0 0 12px;line-height:1.5;">Good news · <strong>${escapeHtml(opts.brandName)}</strong> just sold on ICYACUMI.</p>
       <p style="margin:0 0 8px;font-size:13px;color:#6b5e4e;">Buyer: ${escapeHtml(opts.customerName || "Customer")}</p>
       ${buyerEmail}
       <p style="margin:0 0 8px;font-size:13px;color:#6b5e4e;">Reference: ${escapeHtml(opts.reference)}</p>
       ${payment}
       ${ship}
       <table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;margin-top:12px;">
         <tr>
           <th align="left" style="padding-bottom:8px;border-bottom:2px solid #1a1a1a;">Item</th>
           <th style="padding-bottom:8px;border-bottom:2px solid #1a1a1a;">Qty</th>
           <th align="right" style="padding-bottom:8px;border-bottom:2px solid #1a1a1a;">Amount</th>
         </tr>
         ${rows}
       </table>
       <p style="margin:16px 0 0;text-align:right;font-size:18px;"><strong>Brand total: ${formatRwf(opts.total)}</strong></p>
       <p style="margin:24px 0 0;"><a href="${FRONTEND_URL}/portal/sales" style="color:#b5563a;">Open sales in portal</a></p>`,
    ),
  });
}

export async function sendBrandStockAlertEmail(opts: {
  to: string | string[];
  brandName: string;
  productName: string;
  stockQuantity: number;
  reference?: string;
}) {
  const soldOut = opts.stockQuantity <= 0;
  return sendMail({
    to: opts.to,
    subject: soldOut
      ? `Sold out · ${opts.productName}`
      : `Low stock · ${opts.productName}`,
    html: layout(
      soldOut ? "Product sold out" : "Low stock alert",
      `<p style="margin:0 0 12px;"><strong>${escapeHtml(opts.productName)}</strong> for ${escapeHtml(opts.brandName)} is now ${
        soldOut ? "<strong>sold out</strong>" : `down to <strong>${opts.stockQuantity}</strong> left`
      }.</p>
       ${
         opts.reference
           ? `<p style="margin:0 0 12px;font-size:13px;color:#6b5e4e;">Triggered by order ${escapeHtml(opts.reference)}.</p>`
           : ""
       }
       <p style="margin:0;">Update stock in the <a href="${FRONTEND_URL}/portal/products" style="color:#b5563a;">brand portal</a>.</p>`,
    ),
  });
}

export async function sendPayoutRequestedEmail(opts: {
  brandName: string;
  amount: number;
  feeAmount?: number;
  note?: string;
  brandEmails: string[];
}) {
  const adminTo = NOTIFY_EMAIL;
  const fee = Math.max(0, Math.round(opts.feeAmount ?? 0));
  const feeLine =
    fee > 0
      ? `<p style="margin:0 0 12px;">Withdrawal fee: <strong>${formatRwf(fee)}</strong> · brand receives <strong>${formatRwf(opts.amount)}</strong> · total from earnings <strong>${formatRwf(opts.amount + fee)}</strong>.</p>`
      : "";
  if (adminTo) {
    await sendMail({
      to: adminTo,
      subject: `Payout request · ${opts.brandName} · ${formatRwf(opts.amount)}`,
      html: layout(
        "Payout requested",
        `<p style="margin:0 0 12px;"><strong>${escapeHtml(opts.brandName)}</strong> requested ${formatRwf(opts.amount)}.</p>
         ${feeLine}
         ${opts.note ? `<p style="margin:0 0 12px;color:#6b5e4e;">${escapeHtml(opts.note)}</p>` : ""}
         <p style="margin:0;"><a href="${FRONTEND_URL}/admin/payouts" style="color:#b5563a;">Review in admin</a></p>`,
      ),
    });
  }
  if (opts.brandEmails.length) {
    await sendMail({
      to: opts.brandEmails,
      subject: `Payout request received · ${formatRwf(opts.amount)}`,
      html: layout(
        "Payout request received",
        `<p style="margin:0 0 12px;">We received your withdrawal request for <strong>${formatRwf(opts.amount)}</strong>.</p>
         ${feeLine}
         <p style="margin:0;">Admin will review and send the money to your saved payout destination.</p>
         <p style="margin:12px 0 0;"><a href="${FRONTEND_URL}/portal/payments" style="color:#b5563a;">View payments</a></p>`,
      ),
    });
  }
}

export async function sendPayoutStatusEmail(opts: {
  to: string[];
  brandName: string;
  amount: number;
  status: string;
  note?: string;
}) {
  if (!opts.to.length) return { ok: false, skipped: true };
  const label =
    opts.status === "paid"
      ? "Payout paid"
      : opts.status === "rejected"
        ? "Payout rejected"
        : "Payout updated";
  return sendMail({
    to: opts.to,
    subject: `${label} · ${formatRwf(opts.amount)}`,
    html: layout(
      label,
      `<p style="margin:0 0 12px;">${escapeHtml(opts.brandName)} payout of <strong>${formatRwf(opts.amount)}</strong> is now <strong>${escapeHtml(opts.status)}</strong>.</p>
       ${opts.note ? `<p style="margin:0 0 12px;color:#6b5e4e;">${escapeHtml(opts.note)}</p>` : ""}
       <p style="margin:0;"><a href="${FRONTEND_URL}/portal/payments" style="color:#b5563a;">Open payments</a></p>`,
    ),
  });
}

export async function sendOrderStatusEmail(opts: {
  to: string | string[];
  customerName: string;
  reference: string;
  status: string;
  statusLabel: string;
  trackingCode?: string | null;
  carrier?: string | null;
  audience: "customer" | "brand";
  brandName?: string;
}) {
  const tracking =
    opts.trackingCode
      ? `<p style="margin:12px 0 0;font-size:13px;color:#6b5e4e;">Tracking${opts.carrier ? ` (${escapeHtml(opts.carrier)})` : ""}: <strong>${escapeHtml(opts.trackingCode)}</strong></p>`
      : "";

  if (opts.audience === "brand") {
    return sendMail({
      to: opts.to,
      subject: `Order ${opts.reference} · ${opts.statusLabel}`,
      html: layout(
        "Order update for your brand",
        `<p style="margin:0 0 12px;">${escapeHtml(opts.brandName || "Your brand")} · order <strong>${escapeHtml(opts.reference)}</strong> is now <strong>${escapeHtml(opts.statusLabel)}</strong>.</p>
         <p style="margin:0 0 8px;font-size:13px;color:#6b5e4e;">Buyer: ${escapeHtml(opts.customerName)}</p>
         ${tracking}
         <p style="margin:24px 0 0;"><a href="${FRONTEND_URL}/portal/sales" style="color:#b5563a;">View sales</a></p>`,
      ),
    });
  }

  return sendMail({
    to: opts.to,
    subject: `Order ${opts.reference} · ${opts.statusLabel}`,
    html: layout(
      "Your order update",
      `<p style="margin:0 0 12px;">Hi ${escapeHtml(opts.customerName)},</p>
       <p style="margin:0 0 12px;">Order <strong>${escapeHtml(opts.reference)}</strong> is now <strong>${escapeHtml(opts.statusLabel)}</strong>.</p>
       ${tracking}
       <p style="margin:24px 0 0;"><a href="${FRONTEND_URL}/track?ref=${encodeURIComponent(opts.reference)}" style="color:#b5563a;">Track order</a></p>`,
    ),
  });
}

export async function sendContactNotification(opts: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const to = NOTIFY_EMAIL || SMTP_USER;
  if (!to) return { ok: false, skipped: true, error: "No notify email" };

  await sendMail({
    to: opts.email,
    subject: `We received your message · ${opts.subject}`,
    html: layout(
      "Message received",
      `<p style="margin:0 0 12px;">Hi ${escapeHtml(opts.name)},</p>
       <p style="margin:0 0 12px;">Thanks for writing to ICYACUMI. We got your note about <strong>${escapeHtml(opts.subject)}</strong> and will reply soon.</p>`,
    ),
  });

  return sendMail({
    to,
    replyTo: opts.email,
    subject: `Contact · ${opts.subject} · ${opts.name}`,
    html: layout(
      "New contact message",
      `<p style="margin:0 0 8px;"><strong>From:</strong> ${escapeHtml(opts.name)} &lt;${escapeHtml(opts.email)}&gt;</p>
       <p style="margin:0 0 8px;"><strong>Subject:</strong> ${escapeHtml(opts.subject)}</p>
       <p style="margin:16px 0 0;white-space:pre-wrap;line-height:1.5;">${escapeHtml(opts.message)}</p>`,
    ),
  });
}

export async function sendNewsletterWelcome(opts: { email: string }) {
  return sendMail({
    to: opts.email,
    subject: "You're on the ICYACUMI list",
    html: layout(
      "You're on the list",
      `<p style="margin:0 0 12px;">Thanks for subscribing.</p>
       <p style="margin:0 0 12px;">We'll send season drops, night markets, and floor news · no spam.</p>
       <p style="margin:0;"><a href="${FRONTEND_URL}/shop" style="color:#b5563a;">Browse the shop</a></p>`,
    ),
  });
}

export async function sendListingPublishedEmail(opts: {
  to: string[];
  brandName: string;
  kind: "product" | "event" | "ad";
  title: string;
  href: string;
}) {
  if (!opts.to.length) return { ok: false, skipped: true };
  const label =
    opts.kind === "product" ? "Product" : opts.kind === "event" ? "Event" : "Ad";
  return sendMail({
    to: opts.to,
    subject: `${label} published · ${opts.title}`,
    html: layout(
      `${label} is live`,
      `<p style="margin:0 0 12px;"><strong>${escapeHtml(opts.title)}</strong> for ${escapeHtml(opts.brandName)} is now on the marketplace.</p>
       <p style="margin:0;"><a href="${FRONTEND_URL}${opts.href}" style="color:#b5563a;">View listing</a></p>`,
    ),
  });
}
