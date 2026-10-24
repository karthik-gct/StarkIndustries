import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const PORT = parseInt(process.env.PORT ?? '3100');

export default defineConfig({
  plugins: [react()],
  server: {
    port: PORT + 1,
    proxy: {
      '/api': {
        target: `http://localhost:${PORT}`,
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/client/test-setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80 },
    },
  },
});
