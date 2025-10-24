import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
    },
  },
  plugins: [react()],
})
