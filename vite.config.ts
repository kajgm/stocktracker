import vue from '@vitejs/plugin-vue';
import EnvironmentPlugin from 'vite-plugin-environment';
import { defineConfig } from 'vite';
import { resolve } from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('./package.json');

export default defineConfig({
  plugins: [
    vue(),
    EnvironmentPlugin({
      FMP_KEY: null,
      STOCK_TICKERS: 'MSFT,AAPL,NVDA,AMD,INTC,AMZN',
      CRYPTO_TICKERS: 'ETH-USD,BTC-USD',
      appVersion: version
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      ':common': resolve(__dirname, '../common/src')
    }
  }
});
