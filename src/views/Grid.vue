<script setup lang="ts">
import { type StatusType, type TickerType } from '@/types/types';

const props = defineProps<{
  tickerData: Map<string, TickerType>;
  socketStatus: StatusType;
}>();
</script>

<template>
  <header>
    <div class="wrapper">
      <div v-if="props.socketStatus == 'connecting'" class="info">
        <h1>Connecting...</h1>
      </div>
      <div v-else-if="props.socketStatus == 'connected'" class="info">
        <div v-for="[id, ticker] in tickerData" :key="id">
          <h1>{{ ticker.id }}</h1>
          <div v-if="ticker.status == 'connecting'" class="info">
            <h1>Connecting...</h1>
          </div>
          <div v-else>
            <div class="value">
              <img src="@/assets/triangle.svg" class="triangle" :class="ticker.dirFilter" />
              <h1 class="green price">${{ ticker.curPrice }}</h1>
            </div>
            <h1>Volume: {{ ticker.volume }}</h1>
          </div>
        </div>
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
