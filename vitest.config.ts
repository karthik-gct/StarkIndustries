import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
<<<<<<< HEAD
    globals: true,
    environment: 'node',
    include: ['src/server/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/server/**/*.ts'],
      exclude: ['src/server/**/*.test.ts'],
=======
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/server/lib/fileio/**'],
>>>>>>> origin/main
      thresholds: { lines: 80 },
    },
  },
});
