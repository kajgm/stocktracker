<script setup lang="ts">
import { computed } from 'vue';
import { useTickerStore } from './store/ticker';

const tickerStore = useTickerStore();

const cryptoTickers = computed<string[]>(() => {
  return tickerStore.cryptoKeys;
});

const stockTickers = computed<string[]>(() => {
  return tickerStore.stockKeys;
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
