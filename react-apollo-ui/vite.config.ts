import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';

export default defineConfig({
  plugins: [react(), tailwindcss(), TanStackRouterVite()],
  server: {
    port: 3080,
    proxy: {
      '/graphql': { target: 'http://localhost:5080', changeOrigin: true },
      '/api': { target: 'http://localhost:5080', changeOrigin: true },
    },
  },
});
