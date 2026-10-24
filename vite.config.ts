<<<<<<< HEAD
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
=======
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

<<<<<<< HEAD
const PORT = parseInt(process.env.PORT ?? '3100');
>>>>>>> origin/main

export default defineConfig({
  plugins: [react()],
  server: {
<<<<<<< HEAD
    port: parseInt(process.env.PORT || '3100'),
    proxy: {
      '/api': {
        target: `http://localhost:${parseInt(process.env.PORT || '3100') + 1}`,
=======
    port: PORT + 1,
    proxy: {
      '/api': {
        target: `http://localhost:${PORT}`,
>>>>>>> origin/main
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
<<<<<<< HEAD
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test-setup.ts', 'src/client/main.tsx'],
    },
  },
})
=======
    setupFiles: ['./src/client/test-setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80 },
    },
=======
const EXPRESS_PORT = parseInt(process.env.PORT ?? '3100', 10);

export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    port: EXPRESS_PORT + 1,
    proxy: {
      '/api': `http://localhost:${EXPRESS_PORT}`,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/client/test-setup.ts'],
>>>>>>> origin/main
  },
});
>>>>>>> origin/main
