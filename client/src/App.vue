<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { websocketConnect } from './socket/socket';
import { restApiPoll } from './api/api';
import { useTickerStore } from './store/ticker';
import { pollUpdatedTickers } from './server/server';

const tickerStore = useTickerStore();

const cryptoTickers = computed<string[]>(() => {
  return tickerStore.cryptoTickers;
});

const stockTickers = computed<string[]>(() => {
  return tickerStore.stockTickers;
});

onMounted(() => {
  // Local configuration api server
  pollUpdatedTickers();

  // Crypto Coinbase websocket
  let cryptoSocket = undefined;
  if (cryptoTickers.value) {
    cryptoSocket = websocketConnect();
  }
  tickerStore.setSocket(cryptoSocket);

  // Financial Modeling Prep api polling
  if (process.env.FMP_KEY) {
    restApiPoll();
  }
});
</script>

<template>
  <div class="flex h-screen">
    <div v-if="cryptoTickers || stockTickers" class="w-pi-w h-pi-h m-auto">
      <RouterView />
    </div>
    <div v-else>
      <h1 class="text-4xl">Add some tickers to your .env or post some tickers to the server to get started</h1>
    </div>
  </div>
</template>
