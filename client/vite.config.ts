import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import EnvironmentPlugin from 'vite-plugin-environment';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    EnvironmentPlugin(['FMP_KEY', 'STOCK_TICKERS', 'CRYPTO_TICKERS'])
    // EnvironmentPlugin({
    //   FMP_KEY: 'undefined',
    //   STOCK_TICKERS: 'MSFT,AAPL,NVDA,AMD,INTC,AMZN',
    //   CRYPTO_TICKERS: 'ETH-USD,BTC-USD'
    // })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      ':common': resolve(__dirname, '../common/src')
    }
  }
});
