import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// See https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In dev, forward /api calls to the local Worker (wrangler dev on 8787)
      // so the frontend can call `/api/health` without hardcoding a host.
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
