import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@myorg/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  optimizeDeps: {
    include: ['@myorg/ui'],
  },
  server: {
    port: Number(process.env.WEB_PORT) || 5173,
    host: true, // Listen on all addresses (required for Docker)
    watch: {
      usePolling: true, // Enable polling for Docker volumes
      interval: 1000, // Check for changes every second
    },
    proxy: {
      '/api': {
        target: process.env.API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
