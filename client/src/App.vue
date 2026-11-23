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
    <div v-if="!ready" class="m-auto px-4 text-center" role="status">
      <h1 class="mx-auto min-w-0 break-words text-3xl" :class="tickerStore.connection == 'ERROR' ? 'text-bad' : 'text-ink-2'">
        {{ tickerStore.connection == 'ERROR' ? 'Server unreachable, retrying...' : 'Connecting...' }}
      </h1>
    </div>
    <div v-else-if="tickerStore.tickerCount > 0" class="w-pi-w h-pi-h m-auto">
      <RouterView />
    </div>
    <div v-else class="m-auto max-w-md px-4">
      <h1 class="text-3xl">No tickers configured.</h1>
      <p class="mt-3 text-muted">
        <RouterLink to="/settings" class="text-ink underline decoration-rule-2 hover:text-accent"
          >Add tickers</RouterLink
        >, or set <span class="measured text-ink-2">STOCK_TICKERS</span> /
        <span class="measured text-ink-2">CRYPTO_TICKERS</span> on the server.
      </p>
    </div>
  </div>
</template>
