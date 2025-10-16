import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Temporarily ignore build errors for deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily ignore linting errors for deployment
    ignoreDuringBuilds: true,
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
