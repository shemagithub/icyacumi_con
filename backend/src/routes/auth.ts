import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  clearAuthCookie,
  createAuthToken,
  getAdminByEmail,
  getBrandUserByEmail,
  getClientByEmail,
  readAuthFromCookie,
  requireAuth,
  requireClient,
  AUTH_COOKIE,
  setAuthCookie,
  type AuthSession,
  type AuthedRequest,
} from "../lib/auth.js";
import { prisma } from "../lib/db.js";
import { consumeEmailCode, issueEmailCode } from "../lib/email-codes.js";
import { sendBrandSignupNotify, sendWelcomeEmail } from "../lib/mail.js";

export const authRouter = Router();

function redirectFor(session: AuthSession) {
  if (session.type === "admin") return "/admin";
  if (session.type === "brand") return "/portal";
  return "/account";
}

function slugifyBrand(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function clientSession(client: {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  phone?: string | null;
}): AuthSession {
  return {
    type: "client",
    userId: client.id,
    email: client.email,
    name: client.name,
    // Keep JWT lean · avatar is loaded from DB in /me
    avatarUrl: null,
    phone: client.phone ?? null,
  };
}

function clientUserPayload(client: {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  phone?: string | null;
}) {
  return {
    type: "client" as const,
    userId: client.id,
    email: client.email,
    name: client.name,
    avatarUrl: client.avatarUrl ?? null,
    phone: client.phone ?? null,
  };
}

function clientProfile(client: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: client.id,
    email: client.email,
    name: client.name,
    phone: client.phone,
    avatarUrl: client.avatarUrl,
    addressLine1: client.addressLine1,
    addressLine2: client.addressLine2,
    city: client.city,
    state: client.state,
    postalCode: client.postalCode,
    country: client.country,
    emailVerified: Boolean(client.emailVerifiedAt),
    createdAt: client.createdAt,
  };
}

authRouter.get("/me", async (req, res) => {
  const token = req.cookies?.[AUTH_COOKIE] as string | undefined;
  const session = await readAuthFromCookie(token);
  if (!session) {
    res.json({ user: null });
    return;
  }

  if (session.type === "client") {
    const client = await prisma.client.findUnique({ where: { id: session.userId } });
    if (!client) {
      clearAuthCookie(res);
      res.json({ user: null });
      return;
    }
    const user = clientUserPayload(client);
    res.json({ user, redirectTo: redirectFor(clientSession(client)), profile: clientProfile(client) });
    return;
  }

  res.json({
    user: session,
    redirectTo: redirectFor(session),
  });
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.post("/login", async (req, res) => {
  const email = String(req.body?.email ?? "")
    .toLowerCase()
    .trim();
  const password = String(req.body?.password ?? "");
  const asRole = String(req.body?.as ?? "auto"); // auto | client | brand | admin

  if (!email || !password) {
    res.status(400).json({ error: "Email and password required." });
    return;
  }

  async function loginAdmin() {
    const user = await getAdminByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
    const session: AuthSession = {
      type: "admin",
      userId: user.id,
      email: user.email,
      name: user.name,
    };
    return session;
  }

  async function loginBrand() {
    const user = await getBrandUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
    if (!user.emailVerifiedAt) {
      return {
        needsVerification: true as const,
        email: user.email,
        name: user.name,
      };
    }
    if (user.brand.status !== "approved") {
      return {
        needsApproval: true as const,
        email: user.email,
        name: user.name,
        brandName: user.brand.name,
        status: user.brand.status,
        rejectedReason: user.brand.rejectedReason,
      };
    }
    const session: AuthSession = {
      type: "brand",
      userId: user.id,
      brandId: user.brandId,
      email: user.email,
      name: user.name,
      brandName: user.brand.name,
      brandSlug: user.brand.slug,
    };
    return session;
  }

  async function loginClient() {
    const user = await getClientByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
    if (!user.emailVerifiedAt) {
      return { needsVerification: true as const, email: user.email, name: user.name };
    }
    return clientSession(user);
  }

  if (asRole === "admin") {
    const session = await loginAdmin();
    if (!session) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    const token = await createAuthToken(session);
    setAuthCookie(res, token);
    res.json({ ok: true, role: session.type, redirectTo: redirectFor(session), user: session });
    return;
  }

  if (asRole === "brand") {
    const result = await loginBrand();
    if (!result) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    if ("needsVerification" in result) {
      await issueEmailCode({
        email: result.email,
        purpose: "verify",
        account: "brand",
        name: result.name,
      });
      res.status(403).json({
        error: "Verify your email first. We sent a new code.",
        needsVerification: true,
        email: result.email,
      });
      return;
    }
    if ("needsApproval" in result) {
      res.status(403).json({
        error:
          result.status === "rejected"
            ? result.rejectedReason ||
              "This brand application was not approved."
            : "Your brand is waiting for platform approval.",
        needsApproval: true,
        status: result.status,
        email: result.email,
        brandName: result.brandName,
        redirectTo: `/brand-pending?email=${encodeURIComponent(result.email)}&brand=${encodeURIComponent(result.brandName)}`,
      });
      return;
    }
    const token = await createAuthToken(result);
    setAuthCookie(res, token);
    res.json({ ok: true, role: result.type, redirectTo: redirectFor(result), user: result });
    return;
  }

  if (asRole === "client") {
    const result = await loginClient();
    if (!result) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    if ("needsVerification" in result) {
      await issueEmailCode({
        email: result.email,
        purpose: "verify",
        account: "client",
        name: result.name,
      });
      res.status(403).json({
        error: "Verify your email first. We sent a new code.",
        needsVerification: true,
        email: result.email,
      });
      return;
    }
    const token = await createAuthToken(result);
    setAuthCookie(res, token);
    res.json({ ok: true, role: result.type, redirectTo: redirectFor(result), user: result });
    return;
  }

  // auto: admin → brand → client
  const adminSession = await loginAdmin();
  if (adminSession) {
    const token = await createAuthToken(adminSession);
    setAuthCookie(res, token);
    res.json({
      ok: true,
      role: adminSession.type,
      redirectTo: redirectFor(adminSession),
      user: adminSession,
    });
    return;
  }

  const brandSession = await loginBrand();
  if (brandSession) {
    if ("needsVerification" in brandSession) {
      await issueEmailCode({
        email: brandSession.email,
        purpose: "verify",
        account: "brand",
        name: brandSession.name,
      });
      res.status(403).json({
        error: "Verify your email first. We sent a new code.",
        needsVerification: true,
        email: brandSession.email,
      });
      return;
    }
    if ("needsApproval" in brandSession) {
      res.status(403).json({
        error:
          brandSession.status === "rejected"
            ? brandSession.rejectedReason ||
              "This brand application was not approved."
            : "Your brand is waiting for platform approval.",
        needsApproval: true,
        status: brandSession.status,
        email: brandSession.email,
        brandName: brandSession.brandName,
        redirectTo: `/brand-pending?email=${encodeURIComponent(brandSession.email)}&brand=${encodeURIComponent(brandSession.brandName)}`,
      });
      return;
    }
    const token = await createAuthToken(brandSession);
    setAuthCookie(res, token);
    res.json({
      ok: true,
      role: brandSession.type,
      redirectTo: redirectFor(brandSession),
      user: brandSession,
    });
    return;
  }

  const clientResult = await loginClient();
  if (!clientResult) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }
  if ("needsVerification" in clientResult) {
    await issueEmailCode({
      email: clientResult.email,
      purpose: "verify",
      account: "client",
      name: clientResult.name,
    });
    res.status(403).json({
      error: "Verify your email first. We sent a new code.",
      needsVerification: true,
      email: clientResult.email,
    });
    return;
  }

  const token = await createAuthToken(clientResult);
  setAuthCookie(res, token);
  res.json({
    ok: true,
    role: clientResult.type,
    redirectTo: redirectFor(clientResult),
    user: clientResult,
  });
});

authRouter.post("/register", async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  const email = String(req.body?.email ?? "")
    .toLowerCase()
    .trim();
  const password = String(req.body?.password ?? "");
  const phone = String(req.body?.phone ?? "").trim().slice(0, 40) || null;
  const avatarUrl = String(req.body?.avatarUrl ?? "").trim() || null;
  const addressLine1 = String(req.body?.addressLine1 ?? "").trim().slice(0, 200) || null;
  const addressLine2 = String(req.body?.addressLine2 ?? "").trim().slice(0, 200) || null;
  const city = String(req.body?.city ?? "").trim().slice(0, 120) || null;
  const state = String(req.body?.state ?? "").trim().slice(0, 120) || null;
  const postalCode = String(req.body?.postalCode ?? "").trim().slice(0, 40) || null;
  const country = String(req.body?.country ?? "").trim().slice(0, 80) || null;

  if (!name || !email || !email.includes("@") || password.length < 6) {
    res.status(400).json({
      error: "Name, valid email, and password (6+ chars) are required.",
    });
    return;
  }

  if (avatarUrl && avatarUrl.length > 900_000) {
    res.status(400).json({ error: "Profile image is too large. Use a smaller photo." });
    return;
  }

  const existingClient = await getClientByEmail(email);
  const existingBrand = await getBrandUserByEmail(email);
  const existingAdmin = await getAdminByEmail(email);
  if (existingClient || existingBrand || existingAdmin) {
    res.status(409).json({ error: "An account with that email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const client = await prisma.client.create({
    data: {
      name,
      email,
      passwordHash,
      phone,
      avatarUrl,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    },
  });

  await issueEmailCode({
    email: client.email,
    purpose: "verify",
    account: "client",
    name: client.name,
  });
  void sendWelcomeEmail({ to: client.email, name: client.name });

  res.status(201).json({
    ok: true,
    needsVerification: true,
    email: client.email,
    redirectTo: `/verify-email?email=${encodeURIComponent(client.email)}`,
  });
});

authRouter.post("/register-brand", async (req, res) => {
  const brandName = String(req.body?.brandName ?? "").trim().slice(0, 160);
  const location = String(req.body?.location ?? "").trim().slice(0, 120);
  const shortBio = String(req.body?.shortBio ?? "").trim().slice(0, 500);
  const applicationNote = String(req.body?.applicationNote ?? "").trim().slice(0, 1000);
  const ownerName = String(req.body?.ownerName ?? "").trim().slice(0, 120);
  const email = String(req.body?.email ?? "")
    .toLowerCase()
    .trim();
  const password = String(req.body?.password ?? "");
  const contactEmail = String(req.body?.contactEmail ?? email)
    .toLowerCase()
    .trim()
    .slice(0, 190);
  const contactPhone = String(req.body?.contactPhone ?? "").trim().slice(0, 40) || null;
  const website = String(req.body?.website ?? "").trim().slice(0, 255) || null;
  const instagram = String(req.body?.instagram ?? "").trim().slice(0, 255) || null;
  const iconRaw = String(req.body?.icon ?? "textile").trim();
  const allowedIcons = new Set(["hut", "cloth", "mask", "necklace", "textile", "drum"]);
  const icon = allowedIcons.has(iconRaw) ? iconRaw : "textile";

  let slug =
    slugifyBrand(String(req.body?.slug ?? "").trim()) || slugifyBrand(brandName);

  if (!brandName || !location || !ownerName || !email.includes("@") || password.length < 6) {
    res.status(400).json({
      error:
        "Brand name, location, your name, email, and password (6+ chars) are required.",
    });
    return;
  }
  if (!applicationNote || applicationNote.length < 20) {
    res.status(400).json({
      error: "Tell us a bit more about what you sell (at least 20 characters).",
    });
    return;
  }
  if (!slug || slug.length < 2) {
    res.status(400).json({ error: "Could not build a brand URL slug from that name." });
    return;
  }

  const existingClient = await getClientByEmail(email);
  const existingBrand = await getBrandUserByEmail(email);
  const existingAdmin = await getAdminByEmail(email);
  if (existingClient || existingBrand || existingAdmin) {
    res.status(409).json({ error: "An account with that email already exists." });
    return;
  }

  // Avoid slug collisions without forcing the maker to invent one.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt + 1}`;
    const taken = await prisma.brand.findUnique({ where: { slug: candidate } });
    if (!taken) {
      slug = candidate;
      break;
    }
    if (attempt === 5) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const brand = await prisma.brand.create({
    data: {
      name: brandName,
      slug,
      shortBio:
        shortBio ||
        `${brandName} · independent maker on BONE KOBOYI, MADE IN AFREEKA.`,
      location,
      icon,
      status: "pending",
      applicationNote,
      contactEmail: contactEmail.includes("@") ? contactEmail : email,
      contactPhone,
      website,
      instagram,
      users: {
        create: {
          email,
          name: ownerName,
          passwordHash,
          role: "owner",
        },
      },
    },
    include: { users: true },
  });

  await issueEmailCode({
    email,
    purpose: "verify",
    account: "brand",
    name: ownerName,
  });

  void sendBrandSignupNotify({
    brandName: brand.name,
    slug: brand.slug,
    location: brand.location,
    ownerName,
    ownerEmail: email,
    contactPhone,
    applicationNote,
  });

  res.status(201).json({
    ok: true,
    needsVerification: true,
    needsApproval: true,
    email,
    brand: { name: brand.name, slug: brand.slug, status: brand.status },
    redirectTo: `/verify-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(`/brand-pending?email=${encodeURIComponent(email)}&brand=${encodeURIComponent(brand.name)}`)}`,
  });
});

authRouter.post("/verify-email", async (req, res) => {
  const email = String(req.body?.email ?? "")
    .toLowerCase()
    .trim();
  const code = String(req.body?.code ?? "").trim();

  const result = await consumeEmailCode({ email, purpose: "verify", code });
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  if (result.account === "client") {
    const client = await prisma.client.update({
      where: { email },
      data: { emailVerifiedAt: new Date() },
    });
    const session = clientSession(client);
    const token = await createAuthToken(session);
    setAuthCookie(res, token);
    res.json({
      ok: true,
      role: "client",
      redirectTo: "/account",
      user: clientUserPayload(client),
    });
    return;
  }

  if (result.account === "brand") {
    const user = await prisma.brandUser.update({
      where: { email },
      data: { emailVerifiedAt: new Date() },
      include: { brand: true },
    });

    if (user.brand.status !== "approved") {
      res.json({
        ok: true,
        role: "brand",
        needsApproval: true,
        status: user.brand.status,
        email: user.email,
        brandName: user.brand.name,
        redirectTo: `/brand-pending?email=${encodeURIComponent(user.email)}&brand=${encodeURIComponent(user.brand.name)}`,
      });
      return;
    }

    const session: AuthSession = {
      type: "brand",
      userId: user.id,
      brandId: user.brandId,
      email: user.email,
      name: user.name,
      brandName: user.brand.name,
      brandSlug: user.brand.slug,
    };
    const token = await createAuthToken(session);
    setAuthCookie(res, token);
    res.json({
      ok: true,
      role: "brand",
      redirectTo: "/portal",
      user: session,
    });
    return;
  }

  res.json({ ok: true, redirectTo: "/login" });
});

authRouter.post("/resend-verification", async (req, res) => {
  const email = String(req.body?.email ?? "")
    .toLowerCase()
    .trim();
  const client = await getClientByEmail(email);
  if (client) {
    if (client.emailVerifiedAt) {
      res.json({ ok: true, alreadyVerified: true });
      return;
    }
    await issueEmailCode({
      email: client.email,
      purpose: "verify",
      account: "client",
      name: client.name,
    });
    res.json({ ok: true });
    return;
  }

  const brand = await getBrandUserByEmail(email);
  if (brand) {
    if (brand.emailVerifiedAt) {
      res.json({ ok: true, alreadyVerified: true });
      return;
    }
    await issueEmailCode({
      email: brand.email,
      purpose: "verify",
      account: "brand",
      name: brand.name,
    });
    res.json({ ok: true });
    return;
  }

  // Don’t reveal whether the email exists.
  res.json({ ok: true });
});

authRouter.post("/forgot-password", async (req, res) => {
  const email = String(req.body?.email ?? "")
    .toLowerCase()
    .trim();

  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }

  const client = await getClientByEmail(email);
  const brand = client ? null : await getBrandUserByEmail(email);
  const admin = client || brand ? null : await getAdminByEmail(email);

  let mailed = false;
  let devCode: string | undefined;

  if (client) {
    const issued = await issueEmailCode({
      email: client.email,
      purpose: "reset",
      account: "client",
      name: client.name,
    });
    mailed = issued.mailed;
    devCode = issued.devCode;
  } else if (brand) {
    const issued = await issueEmailCode({
      email: brand.email,
      purpose: "reset",
      account: "brand",
      name: brand.name,
    });
    mailed = issued.mailed;
    devCode = issued.devCode;
  } else if (admin) {
    const issued = await issueEmailCode({
      email: admin.email,
      purpose: "reset",
      account: "admin",
      name: admin.name,
    });
    mailed = issued.mailed;
    devCode = issued.devCode;
  }

  res.json({
    ok: true,
    mailed,
    ...(devCode ? { devCode } : {}),
    message: mailed
      ? "Check your email for a 6-digit reset code. It expires in 30 minutes."
      : "If that email is registered, a reset code was prepared. Check your inbox (and spam), or try again in a moment.",
  });
});

authRouter.post("/reset-password", async (req, res) => {
  const email = String(req.body?.email ?? "")
    .toLowerCase()
    .trim();
  const code = String(req.body?.code ?? "").trim();
  const password = String(req.body?.password ?? "");

  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "Enter the email you used for the reset code." });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  const result = await consumeEmailCode({ email, purpose: "reset", code });
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  if (result.account === "client") {
    await prisma.client.update({
      where: { email },
      data: { passwordHash, emailVerifiedAt: now },
    });
  } else if (result.account === "brand") {
    await prisma.brandUser.update({
      where: { email },
      data: { passwordHash, emailVerifiedAt: now },
    });
  } else if (result.account === "admin") {
    await prisma.superAdmin.update({
      where: { email },
      data: { passwordHash },
    });
  }

  // Force a fresh login with the new password.
  clearAuthCookie(res);
  res.json({
    ok: true,
    redirectTo: `/login?reset=1&email=${encodeURIComponent(email)}`,
  });
});

authRouter.get("/profile", requireClient, async (req: AuthedRequest, res) => {
  const session = req.auth!;
  if (session.type !== "client") {
    res.status(401).json({ error: "Client login required." });
    return;
  }
  const client = await prisma.client.findUnique({ where: { id: session.userId } });
  if (!client) {
    res.status(404).json({ error: "Account not found." });
    return;
  }
  res.json({ profile: clientProfile(client) });
});

authRouter.patch("/profile", requireClient, async (req: AuthedRequest, res) => {
  const session = req.auth!;
  if (session.type !== "client") {
    res.status(401).json({ error: "Client login required." });
    return;
  }

  const name = String(req.body?.name ?? "").trim();
  const phone = String(req.body?.phone ?? "").trim().slice(0, 40);
  const avatarUrlRaw = req.body?.avatarUrl;
  const addressLine1 = String(req.body?.addressLine1 ?? "").trim().slice(0, 200);
  const addressLine2 = String(req.body?.addressLine2 ?? "").trim().slice(0, 200);
  const city = String(req.body?.city ?? "").trim().slice(0, 120);
  const state = String(req.body?.state ?? "").trim().slice(0, 120);
  const postalCode = String(req.body?.postalCode ?? "").trim().slice(0, 40);
  const country = String(req.body?.country ?? "").trim().slice(0, 80);

  if (!name) {
    res.status(400).json({ error: "Name is required." });
    return;
  }

  let avatarUrl: string | null | undefined = undefined;
  if (avatarUrlRaw === null || avatarUrlRaw === "") {
    avatarUrl = null;
  } else if (typeof avatarUrlRaw === "string") {
    if (avatarUrlRaw.length > 900_000) {
      res.status(400).json({ error: "Profile image is too large." });
      return;
    }
    avatarUrl = avatarUrlRaw;
  }

  const client = await prisma.client.update({
    where: { id: session.userId },
    data: {
      name,
      phone: phone || null,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      addressLine1: addressLine1 || null,
      addressLine2: addressLine2 || null,
      city: city || null,
      state: state || null,
      postalCode: postalCode || null,
      country: country || null,
    },
  });

  const user = clientUserPayload(client);
  const token = await createAuthToken(clientSession(client));
  setAuthCookie(res, token);

  res.json({ ok: true, profile: clientProfile(client), user });
});

authRouter.post("/change-password", requireAuth, async (req: AuthedRequest, res) => {
  const session = req.auth!;
  const currentPassword = String(req.body?.currentPassword ?? "");
  const nextPassword = String(req.body?.nextPassword ?? "");

  if (!currentPassword) {
    res.status(400).json({ error: "Enter your current password." });
    return;
  }
  if (nextPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters." });
    return;
  }
  if (currentPassword === nextPassword) {
    res.status(400).json({ error: "New password must be different from the current one." });
    return;
  }

  if (session.type === "client") {
    const client = await prisma.client.findUnique({ where: { id: session.userId } });
    if (!client) {
      res.status(404).json({ error: "Account not found." });
      return;
    }
    if (!(await bcrypt.compare(currentPassword, client.passwordHash))) {
      res.status(400).json({ error: "Current password is incorrect." });
      return;
    }
    await prisma.client.update({
      where: { id: client.id },
      data: { passwordHash: await bcrypt.hash(nextPassword, 10) },
    });
  } else if (session.type === "brand") {
    const brand = await prisma.brandUser.findUnique({ where: { id: session.userId } });
    if (!brand) {
      res.status(404).json({ error: "Account not found." });
      return;
    }
    if (!(await bcrypt.compare(currentPassword, brand.passwordHash))) {
      res.status(400).json({ error: "Current password is incorrect." });
      return;
    }
    await prisma.brandUser.update({
      where: { id: brand.id },
      data: { passwordHash: await bcrypt.hash(nextPassword, 10) },
    });
  } else if (session.type === "admin") {
    const admin = await prisma.superAdmin.findUnique({ where: { id: session.userId } });
    if (!admin) {
      res.status(404).json({ error: "Account not found." });
      return;
    }
    if (!(await bcrypt.compare(currentPassword, admin.passwordHash))) {
      res.status(400).json({ error: "Current password is incorrect." });
      return;
    }
    await prisma.superAdmin.update({
      where: { id: admin.id },
      data: { passwordHash: await bcrypt.hash(nextPassword, 10) },
    });
  } else {
    res.status(401).json({ error: "Please log in first." });
    return;
  }

  clearAuthCookie(res);
  res.json({
    ok: true,
    reLogin: true,
    redirectTo: `/login?changed=1&email=${encodeURIComponent(session.email)}`,
  });
});

authRouter.get("/orders", requireClient, async (req: AuthedRequest, res) => {
  const session = req.auth!;
  if (session.type !== "client") {
    res.status(401).json({ error: "Client login required." });
    return;
  }
  const orders = await prisma.order.findMany({
    where: {
      OR: [{ clientId: session.userId }, { email: session.email }],
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const { mapOrder } = await import("../lib/orders.js");
  res.json({ orders: orders.map(mapOrder) });
});
