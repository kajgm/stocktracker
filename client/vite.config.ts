import vue from '@vitejs/plugin-vue';
import EnvironmentPlugin from 'vite-plugin-environment';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue(), EnvironmentPlugin('all', { prefix: '' })],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      ':common': resolve(__dirname, '../common/src')
    }
  }
});
