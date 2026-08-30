import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "bk_auth";

export type PortalSession = {
  type: "brand";
  userId: string;
  brandId: string;
  email: string;
  name: string;
  brandName: string;
  brandSlug: string;
};

function secretKey() {
  const secret =
    process.env.PORTAL_SESSION_SECRET ??
    "bone-koboyi-portal-dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function readPortalSession(): Promise<PortalSession | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.type !== "brand") return null;
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
  } catch {
    return null;
  }
}

export async function requirePortalSession(): Promise<PortalSession> {
  const session = await readPortalSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}
