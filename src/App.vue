<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { websocketConnect } from './socket/socket';
import { restApiPoll } from './api/api';
import { useTickerStore } from './store/ticker';
import axios from 'axios';

const tickerStore = useTickerStore();

const cryptoTickers = computed<string[]>(() => {
  return tickerStore.cryptoTickers;
});

const stockTickers = computed<string[]>(() => {
  return tickerStore.stockTickers;
});

function pollUpdatedTickers() {
  let connectFlag = false;
  void axios
    .get('http://localhost:3000/api/tickers')
    .then((res) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const cryptoTcks = res.data['cryptoTickers'] as string;
      if (cryptoTcks && cryptoTcks.split(',').toString() != tickerStore.cryptoTickers.toString()) {
        connectFlag = true;
        tickerStore.clearCryptoTickers();
        for (const ticker of cryptoTcks.split(',')) {
          tickerStore.addNewTicker(ticker, 'CRYPTO');
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const stockTcks = res.data['stockTickers'] as string;
      if (stockTcks && stockTcks.split(',').toString() != tickerStore.stockTickers.toString()) {
        connectFlag = true;
        tickerStore.clearStockTickers();
        for (const ticker of stockTcks.split(',')) {
          tickerStore.addNewTicker(ticker, 'STOCK');
        }
      }
    })
    .catch((err) => {
      console.log('Failed to contact server!', err);
    });

  setTimeout(pollUpdatedTickers, 1000);
  return connectFlag;
}

onMounted(() => {
  // Crypto Coinbase websocket
  if (cryptoTickers.value) {
    websocketConnect();
  }

  // Financial Modeling Prep api polling
  if (process.env.FMP_KEY && stockTickers.value) {
    restApiPoll();
  }

  const isConnected = pollUpdatedTickers();

  if (!isConnected) {
    console.log('Failed to connect, defaulting to .env file');
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
