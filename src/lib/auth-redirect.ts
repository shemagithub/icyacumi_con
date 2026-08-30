/** Paths that should never be used as a post-login return target. */
const AUTH_PATH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/brand-signup",
  "/brand-pending",
  "/portal/login",
  "/portal/register",
];

/**
 * Accept only same-origin relative paths (blocks open redirects).
 */
export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/",
): string {
  if (!raw) return fallback;
  let path = raw.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return fallback;
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return fallback;
  }
  if (AUTH_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}?`) || path.startsWith(`${prefix}/`))) {
    return fallback;
  }
  return path;
}

/** Build `/login?next=…` so clients return where they were. */
export function loginHref(next?: string | null): string {
  const path = safeNextPath(next, "/");
  return `/login?next=${encodeURIComponent(path)}`;
}

/** Where to send the user after a successful login. */
export function destinationAfterLogin(
  role: string,
  nextRaw: string | null | undefined,
): string {
  const next = safeNextPath(nextRaw, "");

  if (role === "admin") {
    if (next.startsWith("/admin")) return next;
    return "/admin";
  }
  if (role === "brand") {
    if (next.startsWith("/portal")) return next;
    return "/portal";
  }

  // Clients: back to the page they came from, otherwise home.
  if (next && !next.startsWith("/portal") && !next.startsWith("/admin")) {
    return next;
  }
  return "/";
}
