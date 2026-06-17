import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const useCustomImageLoader =
  Boolean(basePath) && basePath !== "/__NEXT_BASEPATH_PLACEHOLDER__";

// ─── Security headers ─────────────────────────────────────────────────────────
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), payment=(self), microphone=(self)",
  },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""} https://js.stripe.com https://va.vercel-scripts.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com",
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co${process.env.NODE_ENV !== "production" ? " http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*" : ""} https://api.openai.com https://api.anthropic.com https://openrouter.ai https://generativelanguage.googleapis.com https://api.stripe.com https://va.vercel-scripts.com https://vitals.vercel-insights.com`,
      "frame-src 'self' blob: https://js.stripe.com https://hooks.stripe.com",
      "object-src 'self' blob:",
      "worker-src 'self' blob:",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  ...(process.env.VERCEL !== "1" ? { output: "standalone" as const } : {}),
  serverExternalPackages: ["pdf-parse", "mammoth"],
  basePath,
  images: useCustomImageLoader
    ? {
        loader: "custom",
        loaderFile: "./src/lib/image-loader.ts",
      }
    : process.env.VERCEL === "1"
      ? {
          remotePatterns: [
            { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
            { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
          ],
        }
      : {
          unoptimized: true,
          remotePatterns: [
            { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
          ],
        },
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  }