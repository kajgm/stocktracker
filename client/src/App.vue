<script setup lang="ts">
import { onMounted } from 'vue';
import { websocketConnect } from './socket/socket';
import { restApiPoll } from './api/api';
import { useTickerStore } from './store/ticker';

const tickerStore = useTickerStore();
const stockStr = process.env.STOCK_TICKERS;
const cryptoStr = process.env.CRYPTO_TICKERS;
const stockTickers = stockStr != '' ? stockStr && stockStr.split(',') : [];
const cryptoTickers = cryptoStr != '' ? cryptoStr && cryptoStr.split(',') : [];

onMounted(() => {
  // Crypto Coinbase websocket
  if (cryptoTickers) {
    cryptoTickers.forEach((e: string) => tickerStore.addNewTicker(e, 'CRYPTO'));
    websocketConnect();
  }

  // Financial Modeling Prep api polling
  if (process.env.FMP_KEY && process.env.FMP_KEY != '<your_api_key>' && stockTickers) {
    stockTickers.forEach((e: string) => tickerStore.addNewTicker(e, 'STOCK'));
    restApiPoll();
  } else {
    console.log('.env file does not contain an api key, skipping stock tickers');
  }
});
</script>

<template>
  <div class="flex h-screen">
    <div v-if="cryptoTickers || stockTickers" class="w-pi-w h-pi-h m-auto">
      <RouterView />
    </div>
    <div v-else>
      <h1 class="text-4xl">Add some tickers to your .env to get started</h1>
    </div>
  </div>
</template>
