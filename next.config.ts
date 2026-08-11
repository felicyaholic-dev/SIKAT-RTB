import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // The redesigned shell has its own fixed sidebar/bottom-nav chrome, which the
  // dev-only route indicator badge visually collides with. Dev-only, so this
  // has no effect on production.
  devIndicators: false,
};

export default nextConfig;
