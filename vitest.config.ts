// ABOUTME: Vitest configuration for the Party Line connector test suite.
// ABOUTME: Runs every *.test.ts under src in the Node environment.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
