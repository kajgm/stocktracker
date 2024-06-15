import vue from '@vitejs/plugin-vue';
import EnvironmentPlugin from 'vite-plugin-environment';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    EnvironmentPlugin({
      FMP_KEY: 'undefined',
      STOCK_TICKERS: 'MSFT,AAPL,NVDA,AMD,INTC,AMZN',
      CRYPTO_TICKERS: 'ETH-USD,BTC-USD'
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      ':common': resolve(__dirname, '../common/src')
    }
  }
});
