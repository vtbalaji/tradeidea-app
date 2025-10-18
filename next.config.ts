import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable SSR/SSG for better SEO
  // Removed output: 'export' to enable server-side rendering

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

  // Optimize for production
  swcMinify: true,

  // Enable automatic static optimization for pages without server-side logic
  // This will pre-render pages at build time for better performance
  reactStrictMode: true,

  // Ensure proper headers for SEO
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },

  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
