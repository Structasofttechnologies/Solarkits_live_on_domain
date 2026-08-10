import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176,
  },
  base: '/epc-panel/',
  optimizeDeps: {
    include: ['react-is'],
  },
})


