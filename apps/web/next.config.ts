import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  images: {
    remotePatterns: [],
  },
  reactStrictMode: true,
};

export default nextConfig;
