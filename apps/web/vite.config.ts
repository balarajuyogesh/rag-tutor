import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          mui: [
            "@emotion/react",
            "@emotion/styled",
            "@mui/material",
            "@mui/icons-material",
          ],
          markdown: [
            "katex",
            "react-markdown",
            "rehype-katex",
            "remark-gfm",
            "remark-math",
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8005",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
