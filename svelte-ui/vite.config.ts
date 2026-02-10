import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: parseInt(process.env.UI_PORT || '3030', 10),
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.API_PORT || '5030'}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest-setup.ts'],
    // @ts-expect-error vitest InlineConfig types don't include resolve, but it works at runtime
    resolve: {
      conditions: ['browser'],
    },
  },
});
