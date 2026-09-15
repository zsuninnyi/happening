import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Shared SQLite + seed users; avoid cross-file DB races.
    fileParallelism: false,
    env: {
      // Prisma resolves SQLite paths relative to the prisma/ directory.
      DATABASE_URL: process.env.DATABASE_URL ?? 'file:./dev.db',
    },
  },
});
