import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { resolve } from 'path';

// Server the dev server proxies to (matches the nginx proxy in production).
const devServer = process.env.STOCKTRACKER_SERVER || 'http://localhost:3000';

// Only VITE_-prefixed variables are exposed to the browser bundle.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    proxy: {
      '/api': devServer,
      '/socket.io': { target: devServer, ws: true }
    }
  }
});
