<<<<<<< HEAD
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/test-setup.ts', 'src/client/main.tsx', 'src/server/index.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80 }
    }
  },
})
=======
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
>>>>>>> origin/main
