<script setup lang="ts">
import { useTickerStore } from '@/store/ticker';

const tickerStore = useTickerStore();
</script>

<template>
  <div class="wrapper">
    <div v-if="tickerStore.status.overall == 'CONNECTING'" class="info">
      <h1>Connecting...</h1>
    </div>
    <div v-else-if="tickerStore.status.overall == 'CONNECTED'" class="info">
      <div v-for="[id, ticker] in tickerStore.tickerData" :key="id" class="ticker">
        <h1>{{ ticker.id }}</h1>
        <div v-if="ticker.status == 'CONNECTING'">
          <h1>Connecting...</h1>
        </div>
        <div v-else-if="ticker.status == 'ERROR'">
          <h1>Error</h1>
        </div>
        <div v-else>
          <div class="value">
            <img src="@/assets/triangle.svg" class="triangle" :class="ticker.dirFilter" />
            <h1 class="green price">${{ ticker.curPrice }}</h1>
          </div>
          <h1>Vol: {{ ticker.volume }}</h1>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.info {
  text-align: center;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 10px;
}

.ticker {
  min-width: 220px;
  max-width: 220px;
}

h1 {
  font-weight: 500;
  font-size: 1.5rem;
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
  height: 15px;
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

  .ticker {
    max-width: 300px;
    padding: 10px;
  }

  h1 {
    font-size: 2.6rem;
  }

  .triangle {
    height: 30px;
  }
}
</style>
