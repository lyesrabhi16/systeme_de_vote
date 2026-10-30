import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
      '@pages': '/src/pages',
      '@components': '/src/components',
      '@assets': '/src/assets',
      '@api': '/src/api',
      '@utils': '/src/utils',
      '@hooks': '/src/hooks',
      '@services': '/src/services',
      '@schemas': '/src/schemas',
    },
  },
  plugins: [react(), tailwindcss()],
  server: {
    // the API is on the same origin as the page (under /api), also while developing: the session cookie needs it
    proxy: { '/api': process.env.VITE_API_URL ?? 'http://localhost:8000' },
  },
})
