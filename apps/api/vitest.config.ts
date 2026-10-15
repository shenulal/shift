import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@shift/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)) },
  },
  test: {
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/global-setup.ts'],
    environment: 'node',
    pool: 'forks',
    testTimeout: 30_000,
    hookTimeout: 120_000,
    env: { BCRYPT_ROUNDS: '4', NODE_ENV: 'test' },
  },
});
