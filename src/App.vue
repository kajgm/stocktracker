<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { type Status, type TickerType } from '@/types/types';
import Ticker from './views/Ticker.vue';
import Grid from './views/Grid.vue';

const tickers = ['ETH-USD', 'BTC-USD', 'DOGE-USD'];

const status = ref('idle' as Status);
const socketResponse = reactive(new Map<string, TickerType>());

const subscribeMessage = {
  type: 'subscribe',
  product_ids: tickers,
  channels: [
    'heartbeat',
    {
      name: 'ticker',
      product_ids: tickers
    }
  ]
};

function websocketConnect() {
  status.value = 'connecting';
  const socket = new WebSocket('wss://ws-feed.exchange.coinbase.com');

  socket.onopen = () => {
    socket.send(JSON.stringify(subscribeMessage));
  };

  socket.onmessage = (e) => {
    const msg = JSON.parse(e.data);

    if (status.value != 'connected') {
      status.value = 'connected';
    }

    if (msg['type'] == 'ticker') {
      const tickerValue = {
        id: msg['product_id'],
        currentPrice: msg['price'],
        volume: msg['volume_24h'].split('.')[0],
        previousPrice: socketResponse.get(msg['product_id'])?.currentPrice
      } as TickerType;
      socketResponse.set(msg['product_id'], tickerValue);
    }
  };

  socket.onclose = (e) => {
    console.log(e);
    setTimeout(() => {
      status.value = 'connecting';
    }, 60000);
  };

  socket.onerror = (err) => {
    console.log(err);
    status.value = 'error';
    socket.close();
  };
}

onMounted(() => {
  websocketConnect();
});
</script>

<template>
  <div v-if="tickers.length > 1">
    <Grid :tickerData="socketResponse" :status="status" />
  </div>
  <div v-else>
    <Ticker :tickerData="socketResponse.entries().next().value" :status="status" />
  </div>
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
