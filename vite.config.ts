import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // this will transform your svg to a react component
        exportType: "named",
        namedExport: "reactcomponent",
      },
    }),
  ],
  server: {
    watch: {
      usePolling: true,
    },
    port: 3000, // porta do frontend
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // porta do backend
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

});


