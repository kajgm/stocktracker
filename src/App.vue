<script setup lang="ts">
import { onMounted } from 'vue';
import { websocketConnect } from './socket/socket';
import { restApiPoll } from './api/api';
import { useTickerStore } from './store/ticker';
import TickerGrid from './views/TickerGrid.vue';

const tickerStore = useTickerStore();
const stockStr = import.meta.env.VITE_VUE_APP_STOCK_TICKERS;
const cryptoStr = import.meta.env.VITE_VUE_APP_CRYPTO_TICKERS;
const stockTickers = stockStr && (stockStr.split(',') as string[]);
const cryptoTickers = cryptoStr && (cryptoStr.split(',') as string[]);

onMounted(() => {
  // Crypto Coinbase websocket
  if (cryptoTickers) {
    cryptoTickers.forEach((e: string) => tickerStore.addNewTicker(e, 'CRYPTO'));
    websocketConnect();
  }

  // Financial Modeling Prep api polling
  if (import.meta.env.VITE_VUE_APP_FMP_KEY && stockTickers) {
    stockTickers.forEach((e: string) => tickerStore.addNewTicker(e, 'STOCK'));
    restApiPoll();
  } else {
    console.log('.env file with api key and tickers not created!');
  }
});
</script>

<template>
  <div class="flex flex-row min-h-screen justify-center items-center overflow-hidden">
    <div v-if="cryptoTickers || stockTickers">
      <TickerGrid />
    </div>
    <div v-else>
      <h1 class="text-4xl">Add some tickers to your .env to get started</h1>
    </div>
  </div>
</template>
