/// <reference types="vitest/globals" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    deps: {
      optimizer: {
        web3js: {
          include: ['@solana/web3.js'],
        },
      },
    },
  },
});
