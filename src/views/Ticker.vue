<script setup lang="ts">
import { ref } from 'vue';

interface ticker {
  id: string;
  price: string;
  volume: string;
}

const tickerData = ref({} as ticker);

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

const triangleFilter = ref('filterGreen');

const socket = new WebSocket('wss://ws-feed.exchange.coinbase.com');

socket.onopen = () => {
  socket.send(JSON.stringify(subscribeMessage));
};

socket.onmessage = (e) => {
  const msg = JSON.parse(e.data);

  const previousValue = tickerData.value.price;
  if (msg['type'] == 'ticker') {
    tickerData.value.id = msg['product_id'];
    tickerData.value.price = msg['price'];
    tickerData.value.volume = msg['volume_24h'].split('.')[0];
  }

  const previousFilter = triangleFilter.value;
  if (previousValue > msg['price']) {
    triangleFilter.value = 'filterRed';
  } else if (previousValue < msg['price']) {
    triangleFilter.value = 'filterGreen';
  } else {
    triangleFilter.value = previousFilter;
  }
};
</script>

<template>
  <header>
    <div class="wrapper">
      <div class="info">
        <h1 data-cy="ticker">{{ tickerData.id }} (Coinbase)</h1>
        <div class="value">
          <img src="@/assets/triangle.svg" class="triangle" :class="triangleFilter" />
          <h1 class="green price">${{ tickerData.price }}</h1>
        </div>
        <h1>Volume: ${{ tickerData.volume }}</h1>
      </div>
    </div>
  </header>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.info {
  text-align: center;
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

.value {
  display: inline-flex;
  align-items: center;
  text-align: center;
}

.triangle {
  height: 30px;
  width: auto;
  position: relative;
  top: -7px;
}

.price {
  vertical-align: middle;
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

  .info {
    text-align: left;
  }
}
</style>
