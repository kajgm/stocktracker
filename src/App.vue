<script setup lang="ts">
import Ticker from './views/Ticker.vue';
import { ref, onMounted } from 'vue';
import { type Status, type TickerType } from '@/types/types';

const status = ref('idle' as Status);
const socketResponse = ref({} as TickerType);
const previousResponse = ref({} as TickerType);

const subscribeMessage = {
  type: 'subscribe',
  product_ids: ['ETH-USD'],
  channels: [
    'heartbeat',
    {
      name: 'ticker',
      product_ids: ['ETH-USD']
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
      previousResponse.value = socketResponse.value;
      socketResponse.value.id = msg['product_id'];
      socketResponse.value.price = msg['price'];
      socketResponse.value.volume = msg['volume_24h'].split('.')[0];
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
  <Ticker :tickerData="socketResponse" :previousData="previousResponse" :status="status" />
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
