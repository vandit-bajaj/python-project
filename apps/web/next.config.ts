import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  connect-src 'self';
  worker-src 'self' blob:;
  img-src 'self' data: blob:;
  script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`.replace(/\s{2,}/g, " ").trim();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@dermalens/analysis-core", "@dermalens/ui", "@dermalens/models"],
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "Content-Security-Policy",
          value: cspHeader
        },
        {
          key: "Permissions-Policy",
          value: "camera=(self), microphone=(), geolocation=()"
        },
        {
          key: "X-Robots-Tag",
          value: "noindex, nofollow"
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin"
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff"
        },
        {
          key: "X-Frame-Options",
          value: "DENY"
        }
      ]
    }
  ]
};

export default nextConfig;
