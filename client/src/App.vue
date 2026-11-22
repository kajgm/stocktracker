<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTickerStore } from './store/ticker';
import { isPhone } from './helpers/viewport';
import MobileHome from './views/MobileHome.vue';

const tickerStore = useTickerStore();
const route = useRoute();
// The settings page is a normal scrolling page, usable even with no tickers or while reconnecting.
const isSettings = computed(() => route.name == 'settings');
const ready = computed(() => tickerStore.connection == 'CONNECTED' && tickerStore.tickersLoaded);
// Phones get one chart-first page for both the grid and chart routes.
const showMobile = computed(() => isPhone.value && ready.value && tickerStore.tickerCount > 0);
const routeParam = (key: string) => {
  const v = route.params[key];
  return typeof v == 'string' ? v : undefined;
};
</script>

<template>
  <RouterView v-if="isSettings" />
  <MobileHome v-else-if="showMobile" :ticker-type="routeParam('tickerType')" :ticker-id="routeParam('tickerId')" />
  <div v-else class="flex h-screen">
    <div v-if="!ready" class="m-auto px-4 text-center">
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
