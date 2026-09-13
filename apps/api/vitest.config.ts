/// <reference types="vitest/globals" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./src/env.ts'],
  },
});
