import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // Keep metadata in <head> for all agents - avoids streaming-metadata
  // hydration mismatches (MetadataWrapper hidden-div vs whitespace).
  htmlLimitedBots: /.*/,
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
