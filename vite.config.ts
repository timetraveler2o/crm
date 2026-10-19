import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": {
        target: "https://getsetflightcrm.netlify.app",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "https://getsetflightcrm.netlify.app",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    include: ["react-is", "recharts"],
  },
  build: {
    sourcemap: false,
  },
});
