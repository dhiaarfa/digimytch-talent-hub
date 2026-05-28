import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const useCustomImageLoader =
  Boolean(basePath) && basePath !== "/__NEXT_BASEPATH_PLACEHOLDER__";

const nextConfig: NextConfig = {
  // Standalone pour Docker/self-host ; Vercel utilise son propre bundler.
  ...(process.env.VERCEL !== "1" ? { output: "standalone" as const } : {}),
  basePath,
  images: useCustomImageLoader
    ? {
        loader: "custom",
        loaderFile: "./src/lib/image-loader.ts",
      }
    : {
        unoptimized: true,
        remotePatterns: [
          { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
        ],
      },
  productionBrowserSourceMaps: false,
  reactStrictMode: false,
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
};

export default nextConfig;
