export function backendUrl() {
  return process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
}

/**
 * Server fetch to the Express API.
 * Public GETs revalidate briefly so pages stay snappy without stale catalog forever.
 * Mutations / credentialed calls stay uncached.
 */
export async function backendFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  const isPublicGet = method === "GET" && init?.cache !== "no-store";
  return fetch(`${backendUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...(isPublicGet
      ? { next: { revalidate: 20 } }
      : { cache: "no-store" }),
  });
}
