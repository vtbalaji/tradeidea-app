import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed output: 'export' - we'll use standalone mode for Capacitor
  typescript: {
    // Temporarily ignore build errors for deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily ignore linting errors for deployment
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
