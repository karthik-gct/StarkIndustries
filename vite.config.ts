import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3101,
    proxy: {
      '/api': 'http://localhost:3100'
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/client/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['src/server/**/*.test.ts']
  }
})
