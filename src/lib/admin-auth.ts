import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "bk_auth";

export type AdminSession = {
  type: "admin";
  userId: string;
  email: string;
  name: string;
};

function secretKey() {
  const secret =
    process.env.PORTAL_SESSION_SECRET ??
    "bone-koboyi-portal-dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function readAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.type !== "admin") return null;
    if (typeof payload.userId !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return {
      type: "admin",
      userId: payload.userId,
      email: payload.email,
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}
