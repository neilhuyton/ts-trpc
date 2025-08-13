import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import netlify from "@netlify/vite-plugin";

export default defineConfig({
  plugins: [react(), netlify()],
  server: {
    proxy: {
      "/.netlify/functions": {
        target: "http://localhost:8888", // Netlify Dev default port
        changeOrigin: true,
      },
    },
  },
});
