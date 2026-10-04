import { createHash } from "node:crypto";
import { gzip } from "node:zlib";
import type { NextFunction, Request, Response } from "express";

type CacheEntry = {
  status: number;
  body: string;
  etag: string;
  expiresAt: number;
  bytes: number;
};

const FRESH_MS = 45_000;
const MAX_ENTRY_BYTES = 2_500_000;
const MAX_TOTAL_BYTES = 32_000_000;
const GZIP_MIN_BYTES = 800;

const store = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CacheEntry | null>>();
let totalBytes = 0;

function cacheKey(req: Request) {
  return `${req.method} ${req.originalUrl}`;
}

/** Public catalog reads only. Orders, carts, and writes stay live. */
export function isPublicCatalogGet(req: Request) {
  if (req.method !== "GET") return false;
  const path = req.path || "";
  if (
    path.startsWith("/orders") ||
    path.startsWith("/shared-carts") ||
    path.startsWith("/coupons")
  ) {
    return false;
  }
  return (
    path === "/health" ||
    path === "/site-settings" ||
    path === "/brands" ||
    path.startsWith("/brands/") ||
    path === "/products" ||
    path.startsWith("/products/") ||
    path === "/events" ||
    path.startsWith("/events/") ||
    path === "/ads" ||
    path === "/search" ||
    path.startsWith("/legal/")
  );
}

function touch(key: string, entry: CacheEntry) {
  store.delete(key);
  store.set(key, entry);
}

function evict(needed: number) {
  while (totalBytes + needed > MAX_TOTAL_BYTES && store.size) {
    const oldest = store.keys().next().value as string | undefined;
    if (!oldest) break;
    const entry = store.get(oldest);
    store.delete(oldest);
    if (entry) totalBytes -= entry.bytes;
  }
}

function remember(key: string, status: number, body: unknown): CacheEntry | null {
  if (status >= 400) return null;
  const json = JSON.stringify(body);
  const bytes = Buffer.byteLength(json);
  if (bytes > MAX_ENTRY_BYTES) return null;
  const previous = store.get(key);
  if (previous) totalBytes -= previous.bytes;
  evict(bytes);
  const entry: CacheEntry = {
    status,
    body: json,
    etag: `"${createHash("sha1").update(json).digest("hex").slice(0, 16)}"`,
    expiresAt: Date.now() + FRESH_MS,
    bytes,
  };
  totalBytes += bytes;
  touch(key, entry);
  return entry;
}

function acceptsGzip(req: Request) {
  return String(req.headers["accept-encoding"] ?? "").includes("gzip");
}

function sendJson(req: Request, res: Response, json: string, status: number, etag?: string) {
  if (res.headersSent) return;
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Vary", "Accept-Encoding");
  if (etag) {
    res.setHeader("ETag", etag);
    res.setHeader(
      "Cache-Control",
      "public, max-age=30, stale-while-revalidate=120",
    );
    const inm = req.headers["if-none-match"];
    if (inm && inm === etag) {
      res.status(304).end();
      return;
    }
  }

  if (!acceptsGzip(req) || json.length < GZIP_MIN_BYTES) {
    res.send(json);
    return;
  }

  gzip(json, (error, packed) => {
    if (error || res.headersSent) {
      if (!res.headersSent) res.send(json);
      return;
    }
    res.setHeader("Content-Encoding", "gzip");
    res.send(packed);
  });
}

/**
 * Coalesce identical public GETs onto one database read, then gzip the JSON.
 * Authenticated and write routes are unchanged.
 */
export function catalogCache(req: Request, res: Response, next: NextFunction) {
  if (!isPublicCatalogGet(req)) {
    next();
    return;
  }

  const key = cacheKey(req);
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    touch(key, hit);
    sendJson(req, res, hit.body, hit.status, hit.etag);
    return;
  }

  const pending = inflight.get(key);
  if (pending) {
    pending
      .then((entry) => {
        if (!entry) {
          if (!res.headersSent) next();
          return;
        }
        sendJson(req, res, entry.body, entry.status, entry.etag);
      })
      .catch(() => {
        if (!res.headersSent) next();
      });
    return;
  }

  let settle: (entry: CacheEntry | null) => void = () => {};
  const gate = new Promise<CacheEntry | null>((resolve) => {
    settle = resolve;
  });
  inflight.set(key, gate);

  const original = res.json.bind(res);
  res.json = ((body: unknown) => {
    const entry = remember(key, res.statusCode || 200, body);
    inflight.delete(key);
    settle(entry);
    if (entry) {
      sendJson(req, res, entry.body, entry.status, entry.etag);
      return res;
    }
    return original(body);
  }) as Response["json"];

  res.on("finish", () => {
    if (inflight.get(key) === gate) {
      inflight.delete(key);
      settle(null);
    }
  });

  next();
}

/** Gzip JSON for routes that are not catalog-cached (auth, portal, admin). */
export function gzipJson(req: Request, res: Response, next: NextFunction) {
  if (!acceptsGzip(req)) {
    next();
    return;
  }
  const original = res.json.bind(res);
  res.json = ((body: unknown) => {
    const json = JSON.stringify(body);
    if (json.length < GZIP_MIN_BYTES || res.headersSent) {
      return original(body);
    }
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Vary", "Accept-Encoding");
    gzip(json, (error, packed) => {
      if (error || res.headersSent) {
        if (!res.headersSent) original(body);
        return;
      }
      res.setHeader("Content-Encoding", "gzip");
      res.status(res.statusCode || 200).send(packed);
    });
    return res;
  }) as Response["json"];
  next();
}
