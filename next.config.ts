import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed standalone output for Vercel compatibility
  experimental: {
    turbo: {
      resolveAlias: {
        canvas: "./empty-module.ts",
      },
    },
  },
};

export default nextConfig;
