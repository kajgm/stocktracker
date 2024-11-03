<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { coinbaseConnect } from './crypto/crypto';
import { fmpConnect } from './stock/stock';
import { useTickerStore } from './store/ticker';
import { pollUpdatedTickers } from './server/server';

const tickerStore = useTickerStore();

const cryptoTickers = computed<string[]>(() => {
  return tickerStore.cryptoKeys;
});

const stockTickers = computed<string[]>(() => {
  return tickerStore.stockKeys;
});

onMounted(() => {
  // Local configuration api server
  pollUpdatedTickers();

  // Crypto Coinbase websocket
  const cryptoSocket = coinbaseConnect();
  tickerStore.setSocket(cryptoSocket);

  // Financial Modeling Prep api polling
  if (process.env.FMP_KEY) {
    fmpConnect();
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
