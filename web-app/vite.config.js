import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Used only by the Vite dev server proxy (production uses `VITE_API_URL` directly).
const apiUrl = process.env.VITE_API_URL || 'http://localhost:5000/api'
const proxyTarget = apiUrl.replace(/\/api\/?$/, '')

export default defineConfig({
  plugins: [react(),
      tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
    headers: {
      // Required for Firebase Auth popup to work without COOP warnings
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  },
})
