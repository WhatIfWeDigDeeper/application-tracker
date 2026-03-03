import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    port: 3040,
    proxy: {
      "/api": {
        target: "http://localhost:5160",
        changeOrigin: true,
        rewrite: (path) => {
          const stripped = path.replace(/^\/api/, "");
          // FastAPI redirects /applications (no trailing slash) to /applications/ via 307,
          // producing a cross-origin Location header. Normalize here to avoid the redirect.
          return stripped === "/applications" ? "/applications/" : stripped;
        },
      },
    },
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart(),
    // react's vite plugin must come after start's vite plugin
    react(),
  ],
});
