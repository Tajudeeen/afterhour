import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Required for Next.js 15 turbo
  },
  images: {
    remotePatterns: [],
  },
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
