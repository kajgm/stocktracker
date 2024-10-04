<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { websocketConnect } from './socket/socket';
import { restApiPoll } from './api/api';
import { useTickerStore } from './store/ticker';
import { getUpdatedTickers, pollUpdatedTickers } from './server/server';

const tickerStore = useTickerStore();

const cryptoTickers = computed<string[]>(() => {
  return tickerStore.cryptoTickers;
});

const stockTickers = computed<string[]>(() => {
  return tickerStore.stockTickers;
});

// Get tickers from local server if available
const isConnected = getUpdatedTickers();
if (!isConnected) {
  console.log('Failed to connect to local server, defaulting to .env file');
  // Defaults from .env file
  const stockStr = process.env.STOCK_TICKERS;
  const cryptoStr = process.env.CRYPTO_TICKERS;
  const envStockTickers = stockStr != '' ? stockStr && stockStr.split(',') : [];
  const envCryptoTickers = cryptoStr != '' ? cryptoStr && cryptoStr.split(',') : [];

  if (envCryptoTickers) {
    envCryptoTickers.forEach((e: string) => tickerStore.addNewTicker(e, 'CRYPTO'));
  }

  if (process.env.FMP_KEY && envStockTickers) {
    envStockTickers.forEach((e: string) => tickerStore.addNewTicker(e, 'STOCK'));
  } else {
    console.log('.env file does not contain a valid api key, skipping stock tickers');
  }
}

onMounted(() => {
  // Crypto Coinbase websocket
  let cryptoSocket;
  if (cryptoTickers.value) {
    cryptoSocket = websocketConnect();
  }

  // Financial Modeling Prep api polling
  if (process.env.FMP_KEY && stockTickers.value) {
    restApiPoll();
  }

  // Local configuration api server
  if (isConnected) {
    pollUpdatedTickers(cryptoSocket);
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
