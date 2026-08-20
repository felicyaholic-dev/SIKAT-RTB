import type { NextConfig } from "next";

// Camera access stays scoped to the security scanner (QrScanner uses
// getUserMedia); every other browser permission this app never asks for is
// explicitly denied rather than left to browser defaults.
const permissionsPolicy = ["camera=(self)", "microphone=()", "geolocation=()", "payment=()", "usb=()"].join(", ");

const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' data:",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: permissionsPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "sharp"],
  // The redesigned shell has its own fixed sidebar/bottom-nav chrome, which the
  // dev-only route indicator badge visually collides with. Dev-only, so this
  // has no effect on production.
  devIndicators: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
