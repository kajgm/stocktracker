<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { type StatusType, type TickerType } from '@/types/types';
import { DEFAULT_TICKER, STOCK_TICKERS, CRYPTO_TICKERS } from './defaults/defaults';
import { websocketConnect } from './socket/socket';
import { restApiPoll } from './api/api';
import Grid from './views/Grid.vue';

const sktStatus = ref('CONNECTING' as StatusType);
const apiStatus = ref('CONNECTING' as StatusType);
const tickerResponse = reactive(
  new Map<string, TickerType>(CRYPTO_TICKERS.concat(STOCK_TICKERS).map((e: string) => [e, DEFAULT_TICKER]))
);

onMounted(() => {
  // Crypto Coinbase websocket
  websocketConnect(sktStatus, tickerResponse);
  sktStatus.value = 'CONNECTED';

  // Financial Modeling Prep api polling
  restApiPoll(apiStatus, tickerResponse);
  apiStatus.value = 'CONNECTED';
});
</script>

<template>
  <Grid :tickerData="tickerResponse" :socketStatus="sktStatus" />
</template>

<style scoped>
header {
  line-height: 1.5;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
