import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const hmrClientPort = Number(process.env.VITE_HMR_CLIENT_PORT ?? 5173);

export default defineConfig({
  plugins: [react()],

  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: {
      host: process.env.VITE_HMR_HOST ?? "localhost",
      clientPort: Number.isInteger(hmrClientPort) ? hmrClientPort : 5173,
      protocol: process.env.VITE_HMR_PROTOCOL === "wss" ? "wss" : "ws",
    },

    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET ?? "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "@emotion/react",
      "@emotion/styled",
      "@tanstack/react-query",
      "react-router",
      "react-router-dom",
    ],
  },
});
