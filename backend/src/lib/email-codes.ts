import bcrypt from "bcryptjs";
import { prisma } from "./db.js";
import {
  isMailConfigured,
  sendPasswordResetEmail,
  sendVerificationCodeEmail,
} from "./mail.js";

export type CodePurpose = "verify" | "reset";
export type CodeAccount = "client" | "brand" | "admin";

const CODE_TTL_MS = 30 * 60 * 1000;

export function generateNumericCode(length = 6) {
  const max = 10 ** length;
  const value = Math.floor(Math.random() * max);
  return String(value).padStart(length, "0");
}

export async function issueEmailCode(opts: {
  email: string;
  purpose: CodePurpose;
  account: CodeAccount;
  name: string;
}) {
  const email = opts.email.toLowerCase().trim();
  const code = generateNumericCode(6);
  const codeHash = await bcrypt.hash(code, 8);

  await prisma.emailCode.updateMany({
    where: {
      email,
      purpose: opts.purpose,
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  await prisma.emailCode.create({
    data: {
      email,
      codeHash,
      purpose: opts.purpose,
      account: opts.account,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  const mailResult =
    opts.purpose === "verify"
      ? await sendVerificationCodeEmail({ to: email, name: opts.name, code })
      : await sendPasswordResetEmail({ to: email, name: opts.name, code });

  const mailed = Boolean(mailResult.ok);
  const skipped = Boolean(mailResult.skipped) || !isMailConfigured();

  if (!mailed) {
    console.warn(
      `[email-codes] ${opts.purpose} code for ${email} not emailed` +
        (skipped ? " (SMTP not configured)" : "") +
        `. Dev code: ${code}`,
    );
  }

  const exposeDevCode =
    !mailed && process.env.NODE_ENV !== "production";

  return {
    mailed,
    skipped,
    ...(exposeDevCode ? { devCode: code } : {}),
  };
}

export async function consumeEmailCode(opts: {
  email: string;
  purpose: CodePurpose;
  code: string;
}) {
  const email = opts.email.toLowerCase().trim();
  const code = String(opts.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    return { ok: false as const, error: "Enter the 6-digit code from your email." };
  }

  const rows = await prisma.emailCode.findMany({
    where: {
      email,
      purpose: opts.purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  for (const row of rows) {
    if (await bcrypt.compare(code, row.codeHash)) {
      await prisma.emailCode.update({
        where: { id: row.id },
        data: { consumedAt: new Date() },
      });
      return { ok: true as const, account: row.account as CodeAccount };
    }
  }

  return { ok: false as const, error: "Invalid or expired code. Request a new one." };
}
