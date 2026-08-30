/**
 * Completes payment for a shared cart without Stripe (demo / offline path).
 * Proxies to the backend catalog route.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const token =
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as { token?: unknown }).token === "string"
      ? (payload as { token: string }).token.trim()
      : "";

  if (!token) {
    return Response.json({ error: "Missing share token." }, { status: 400 });
  }

  const backendUrl =
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    "http://localhost:4000";

  const cookie = request.headers.get("cookie") ?? "";

  const response = await fetch(
    `${backendUrl}/api/catalog/shared-carts/${encodeURIComponent(token)}/complete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json().catch(() => ({}));
  return Response.json(data, { status: response.status });
}
