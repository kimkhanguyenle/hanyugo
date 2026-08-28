import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Shared TypeScript types live in one file so the app and the database
      // schema can't silently drift apart.
      "@hanyugo/shared": path.resolve(__dirname, "./src/types/shared.ts"),
    },
  },
  build: {
    // Split the heaviest libraries into their own chunks so the first paint
    // isn't blocked on downloading the stroke-order engine.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          i18n: ["i18next", "react-i18next", "i18next-browser-languagedetector"],
          hanzi: ["hanzi-writer"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
});
