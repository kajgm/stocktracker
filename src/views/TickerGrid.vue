<script setup lang="ts">
import { useTickerStore } from '@/store/ticker';

const tickerStore = useTickerStore();
</script>

<template>
  <div class="max-w-lg">
    <div v-if="tickerStore.status.overall == 'CONNECTING'" class="text-center">
      <h1 class="font-medium text-4xl">Connecting...</h1>
    </div>
    <div v-else-if="tickerStore.status.overall == 'CONNECTED'" class="flex flex-wrap text-left">
      <div v-for="[id, ticker] in tickerStore.tickerData" :key="id" class="px-6 pt-3 pb-4 min-w-56">
        <h1 class="font-medium text-4xl">{{ ticker.id }}</h1>
        <div v-if="ticker.status == 'CONNECTING'">
          <h1 class="font-medium text-4xl">Connecting...</h1>
        </div>
        <div v-else-if="ticker.status == 'ERROR'">
          <h1 class="font-medium text-4xl">Error</h1>
        </div>
        <div v-else>
          <div class="inline-flex items-middle text-center">
            <svg class="h-5 w-auto relative top-5" :class="ticker.dirFilter" viewBox="0 0 31.417 31.416">
              <path
                d="M29.462 15.707a3.004 3.004 0 0 1-1.474 2.583L6.479 30.999c-.47.275-.998.417-1.526.417a2.98 2.98 0 0 1-1.487-.396 2.997 2.997 0 0 1-1.513-2.604V2.998A3.002 3.002 0 0 1 6.479.415l21.509 12.709a2.997 2.997 0 0 1 1.474 2.583z"
              />
            </svg>
            <h1 class="text-emerald-500 font-medium text-4xl py-2 px-1">${{ ticker.curPrice }}</h1>
          </div>
          <h1 class="font-medium text-3xl">Vol: {{ ticker.volume }}</h1>
        </div>
      </div>
    </div>
  </div>
</template>
