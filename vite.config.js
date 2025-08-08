import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";
import { apiMiddleware } from "./vite-api-middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiMiddleware()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "globalThis",
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor dependencies
          vendor: ["react", "react-dom"],
          clerk: ["@clerk/clerk-react"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-toast",
          ],
          routing: ["react-router-dom"],
          icons: ["lucide-react"],
        },
      },
    },
    chunkSizeWarningLimit: 700, // Increase warning limit slightly
  },
  server: {
    port: process.env.PORT || 5173,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      ".ngrok-free.app", // Allow any ngrok domain
    ],
  },
});
