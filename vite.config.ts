import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://bibliocon-api.test', changeOrigin: true },
      '/sanctum': { target: 'http://bibliocon-api.test', changeOrigin: true },
    },
  },
})
