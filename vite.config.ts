<<<<<<< HEAD
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const PORT = parseInt(process.env.PORT ?? '3100')
=======
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

<<<<<<< HEAD
const PORT = parseInt(process.env.PORT ?? '3100');
>>>>>>> origin/main

export default defineConfig({
  plugins: [react()],
  server: {
    port: PORT + 1,
    proxy: {
<<<<<<< HEAD
      '/api': { target: `http://localhost:${PORT}`, changeOrigin: true }
    }
=======
      '/api': {
        target: `http://localhost:${PORT}`,
        changeOrigin: true,
      },
    },
>>>>>>> origin/main
  },
  test: {
    globals: true,
    environment: 'jsdom',
<<<<<<< HEAD
    setupFiles: ['src/test-setup.ts']
  }
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
