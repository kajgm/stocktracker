<script setup lang="ts">
import { useTickerStore } from './store/ticker';

const tickerStore = useTickerStore();
</script>

<template>
  <div class="flex h-screen">
    <div v-if="tickerStore.connection != 'CONNECTED' || !tickerStore.tickersLoaded" class="m-auto text-center">
      <h1 class="font-medium text-4xl">
        {{ tickerStore.connection == 'ERROR' ? 'Server unreachable, retrying...' : 'Connecting...' }}
      </h1>
    </div>
    <div v-else-if="tickerStore.tickerCount > 0" class="w-pi-w h-pi-h m-auto">
      <RouterView />
    </div>
    <div v-else class="m-auto text-center">
      <h1 class="text-4xl">No tickers configured. Set STOCK_TICKERS / CRYPTO_TICKERS on the server to get started.</h1>
    </div>
  </div>
</template>
