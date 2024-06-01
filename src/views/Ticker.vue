<script setup lang="ts">
import { ref } from 'vue';

interface ticker {
  id: string;
  price: string;
  volume: string;
}

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

const tickerData = ref({} as ticker);

const socket = new WebSocket('wss://ws-feed.exchange.coinbase.com');
socket.onopen = () => {
  socket.send(JSON.stringify(subscribeMessage));
};

socket.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg['type'] == 'ticker') {
    tickerData.value.id = msg['product_id'];
    tickerData.value.price = msg['price'];
    tickerData.value.volume = msg['volume_24h'].split('.')[0];
  }
};
</script>

<template>
  <header>
    <div class="wrapper">
      <div class="info">
        <h1 data-cy="ticker">{{ tickerData.id }} (Coinbase)</h1>
        <h1 class="green">${{ tickerData.price }}</h1>
        <h1>Volume: ${{ tickerData.volume }}</h1>
      </div>
    </div>
  </header>
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

h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.info h1,
.info h3 {
  text-align: center;
}

@media (min-width: 1024px) {
  .info h1,
  .info h3 {
    text-align: left;
  }
}
</style>
