import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    // Flag del modo estático sin servidor; con 'false' el bundle conserva el modo API.
    'import.meta.env.VITE_BROWSER_DEMO': JSON.stringify(mode === 'browser-demo' ? 'true' : 'false'),
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
}));
