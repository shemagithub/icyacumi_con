/**
 * Completes a normal bag checkout without Stripe (demo / offline path).
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const backendUrl =
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    "http://localhost:4000";

  const cookie = request.headers.get("cookie") ?? "";

  const response = await fetch(`${backendUrl}/api/catalog/orders/demo-complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  return Response.json(data, { status: response.status });
}
