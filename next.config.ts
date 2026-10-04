import type { NextConfig } from "next";

const backendUrl = (process.env.BACKEND_URL ?? "http://127.0.0.1:4000").replace(
  "://localhost",
  "://127.0.0.1",
);

const nextConfig: NextConfig = {
  // Keep metadata in <head> for all agents - avoids streaming-metadata
  // hydration mismatches (MetadataWrapper hidden-div vs whitespace).
  htmlLimitedBots: /.*/,
  // Compress responses when the Node server can; static assets also get long cache.
  compress: true,
  experimental: {
    optimizePackageImports: ["jose"],
  },
  images: {
    // WebP encodes faster than AVIF and still cuts file size sharply.
    formats: ["image/webp"],
    qualities: [60, 75],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [48, 64, 96, 128, 256, 384],
  },
  // No Content-Security-Policy in next.config.
  // A second policy (browser extension / embedded preview) with
  // script-src 'none' would AND with ours and still block every script.
  // Enforce CSP at the reverse-proxy / production host if needed.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        source: "/brand/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/scenes/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/products/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/patterns/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/textures/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${backendUrl}/api/auth/:path*`,
      },
      {
        source: "/api/portal/:path*",
        destination: `${backendUrl}/api/portal/:path*`,
      },
      {
        source: "/api/catalog/:path*",
        destination: `${backendUrl}/api/catalog/:path*`,
      },
      {
        source: "/api/admin/:path*",
        destination: `${backendUrl}/api/admin/:path*`,
      },
      {
        source: "/api/health",
        destination: `${backendUrl}/api/health`,
      },
    ];
  },
};

export default nextConfig;
