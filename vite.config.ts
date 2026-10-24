import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
  },
});
