export function backendUrl() {
  const raw =
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    "http://127.0.0.1:4000";
  return raw.replace("://localhost", "://127.0.0.1");
}

/** Parse an API body without crashing when the proxy returns HTML/plain text. */
export async function parseApiJson<T extends Record<string, unknown> = Record<string, unknown>>(
  response: Response,
): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    const error =
      response.status >= 500
        ? "The API is offline. In the backend folder run npm run dev (MySQL must be on 127.0.0.1:3306)."
        : text.replace(/<[^>]+>/g, " ").trim().slice(0, 180) || "Request failed.";
    return { error } as unknown as T;
  }
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
      ? { next: { revalidate: 60 } }
      : { cache: "no-store" }),
  });
}
