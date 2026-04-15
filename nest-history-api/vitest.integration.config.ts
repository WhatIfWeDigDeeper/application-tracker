import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.integration.spec.ts'],
    environment: 'node',
    testTimeout: 20_000,
    pool: 'forks',
    fileParallelism: false,
  },
});
