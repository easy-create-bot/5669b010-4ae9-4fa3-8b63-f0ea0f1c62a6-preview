import { defineConfig } from 'vite'; 
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from "path"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      usePolling: true,
    },
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 8080,  // Expose on port 8080
    allowedHosts: ['heartlandshoppes.ca', 'www.heartlandshoppes.ca','localhost'],
    hmr: {
      protocol: 'ws',  // Use ws (WebSocket) instead of wss for local development
      host: 'localhost',  // Use localhost for HMR
      clientPort: 8080,  // Use the same port as your server
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

