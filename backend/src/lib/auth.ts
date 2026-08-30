import type { Request, Response, NextFunction } from "express";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db.js";

export const AUTH_COOKIE = "bk_auth";

export type AuthSession =
  | {
      type: "admin";
      userId: string;
      email: string;
      name: string;
    }
  | {
      type: "brand";
      userId: string;
      brandId: string;
      email: string;
      name: string;
      brandName: string;
      brandSlug: string;
    }
  | {
      type: "client";
      userId: string;
      email: string;
      name: string;
      avatarUrl?: string | null;
      phone?: string | null;
    };

export type AuthedRequest = Request & { auth?: AuthSession };

function secretKey() {
  return new TextEncoder().encode(
    process.env.PORTAL_SESSION_SECRET ??
      "bone-koboyi-portal-dev-secret-change-me",
  );
}

export async function createAuthToken(session: AuthSession) {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function readAuthFromCookie(
  token?: string,
): Promise<AuthSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.type === "admin") {
      if (typeof payload.userId !== "string" || typeof payload.email !== "string") {
        return null;
      }
      return {
        type: "admin",
        userId: payload.userId,
        email: payload.email,
        name: String(payload.name ?? ""),
      };
    }
    if (payload.type === "brand") {
      if (
        typeof payload.userId !== "string" ||
        typeof payload.brandId !== "string" ||
        typeof payload.email !== "string"
      ) {
        return null;
      }
      return {
        type: "brand",
        userId: payload.userId,
        brandId: payload.brandId,
        email: payload.email,
        name: String(payload.name ?? ""),
        brandName: String(payload.brandName ?? ""),
        brandSlug: String(payload.brandSlug ?? ""),
      };
    }
    if (payload.type === "client") {
      if (typeof payload.userId !== "string" || typeof payload.email !== "string") {
        return null;
      }
      return {
        type: "client",
        userId: payload.userId,
        email: payload.email,
        name: String(payload.name ?? ""),
        avatarUrl:
          typeof payload.avatarUrl === "string" ? payload.avatarUrl : null,
        phone: typeof payload.phone === "string" ? payload.phone : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7 * 1000,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE, { path: "/" });
}

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.[AUTH_COOKIE] as string | undefined;
  const session = await readAuthFromCookie(token);
  if (!session) {
    res.status(401).json({ error: "Please log in first." });
    return;
  }
  req.auth = session;
  next();
}

export async function requireBrand(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.[AUTH_COOKIE] as string | undefined;
  const session = await readAuthFromCookie(token);
  if (!session || session.type !== "brand") {
    res.status(401).json({ error: "Brand login required." });
    return;
  }

  const brand = await prisma.brand.findUnique({
    where: { id: session.brandId },
    select: { status: true, rejectedReason: true, name: true },
  });
  if (!brand || brand.status !== "approved") {
    res.status(403).json({
      error:
        brand?.status === "rejected"
          ? brand.rejectedReason ||
            "This brand application was not approved."
          : "Your brand is waiting for platform approval.",
      needsApproval: true,
      status: brand?.status ?? "pending",
      brandName: brand?.name ?? session.brandName,
    });
    return;
  }

  req.auth = session;
  next();
}

export async function requireClient(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.[AUTH_COOKIE] as string | undefined;
  const session = await readAuthFromCookie(token);
  if (!session || session.type !== "client") {
    res.status(401).json({ error: "Client login required." });
    return;
  }
  req.auth = session;
  next();
}

export async function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.[AUTH_COOKIE] as string | undefined;
  const session = await readAuthFromCookie(token);
  if (!session || session.type !== "admin") {
    res.status(401).json({ error: "Super admin login required." });
    return;
  }
  req.auth = session;
  next();
}

export async function getBrandUserByEmail(email: string) {
  return prisma.brandUser.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          rejectedReason: true,
        },
      },
    },
  });
}

export async function getClientByEmail(email: string) {
  return prisma.client.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
}

export async function getAdminByEmail(email: string) {
  return prisma.superAdmin.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
}

/** @deprecated use AUTH_COOKIE */
export const PORTAL_COOKIE = AUTH_COOKIE;
