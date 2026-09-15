import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  reactStrictMode: true,
  // swcMinify is removed in Next.js 15
};

export default nextConfig;
