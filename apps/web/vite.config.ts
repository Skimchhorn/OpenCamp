/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type ProxyOptions } from 'vite'

// The proxied request is same-origin, so drop Origin; otherwise the backend's CORS check rejects any dev port it does not list.
const backend: ProxyOptions = {
  target: 'http://localhost:8080',
  configure: (proxy) => proxy.on('proxyReq', (req) => req.removeHeader('origin')),
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Dev only: same-origin proxy so the browser needs no CORS. Production builds use VITE_API_URL.
  server: { proxy: { '/api': backend, '/uploads': backend } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
