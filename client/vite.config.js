import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animation':  ['framer-motion'],
          'socket':  ['socket.io-client'],
          'http': ['axios']
      }
    }
  }
})
