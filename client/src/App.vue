<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTickerStore } from './store/ticker';

const tickerStore = useTickerStore();
const route = useRoute();
// The settings page is a normal scrolling page, usable even with no tickers or while reconnecting.
const isSettings = computed(() => route.name == 'settings');
</script>

<template>
  <RouterView v-if="isSettings" />
  <div v-else class="flex h-screen">
    <div v-if="tickerStore.connection != 'CONNECTED' || !tickerStore.tickersLoaded" class="m-auto text-center">
      <h1 class="font-medium text-4xl">
        {{ tickerStore.connection == 'ERROR' ? 'Server unreachable, retrying...' : 'Connecting...' }}
      </h1>
    </div>
    <div v-else-if="tickerStore.tickerCount > 0" class="w-pi-w h-pi-h m-auto">
      <RouterView />
    </div>
    <div v-else class="m-auto max-w-md px-4 text-center">
      <h1 class="text-4xl">No tickers configured.</h1>
      <p class="mt-3 text-lg text-zinc-400">
        <RouterLink to="/settings" class="underline">Add tickers</RouterLink>, or set STOCK_TICKERS / CRYPTO_TICKERS on
        the server.
      </p>
    </div>
  </div>
</template>
