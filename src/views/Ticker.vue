<script setup lang="ts">
import { type Status, type TickerType } from '@/types/types';

const props = defineProps<{
  tickerData: TickerType;
  status: Status;
}>();

const ticker = props.tickerData;
</script>

<template>
  <header>
    <div class="wrapper">
      <div v-if="props.status == 'connecting'" class="info">
        <h1>ETH-USD</h1>
        <h1 class="green price">Connecting...</h1>
      </div>
      <div v-else-if="props.status == 'connected'" class="info">
        <h1>{{ ticker.id }} (Coinbase)</h1>
        <div class="value">
          <img
            v-if="ticker.previousPrice < ticker.currentPrice"
            src="@/assets/triangle.svg"
            class="triangle greenFilter"
          />
          <img
            v-if="ticker.previousPrice > ticker.currentPrice"
            src="@/assets/triangle.svg"
            class="triangle redFilter"
          />
          <h1 class="green price">
            ${{ (parseFloat(ticker.volume) * parseFloat(ticker.currentPrice)).toString().split('.')[0] }}
          </h1>
        </div>
        <h1>Volume: ${{ ticker.volume }}</h1>
      </div>
      <div v-else class="info">
        <h1>Stock Tracker</h1>
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
