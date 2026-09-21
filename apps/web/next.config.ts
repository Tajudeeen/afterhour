import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  transpilePackages: [
    '@afterhours/solana',
    '@afterhours/market-engine',
    '@afterhours/risk-engine',
    '@afterhours/agent',
    '@afterhours/config',
    '@afterhours/types',
  ],
  serverExternalPackages: [
    '@solana/web3.js',
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
    '@solana/wallet-adapter-wallets',
    'bs58',
  ],
  images: {
    remotePatterns: [],
  },
  reactStrictMode: true,
};

export default nextConfig;
