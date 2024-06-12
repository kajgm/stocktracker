<script setup lang="ts">
import { computed } from 'vue';
import { useTickerStore } from '@/store/ticker';
import { type SizeType } from '@/types/types';
import TickerBox from '@/components/ticker/TickerBox.vue';

const tickerStore = useTickerStore();
const tickerIds = computed<string[]>(() => {
  return tickerStore.tickerKeys;
});
const boxSize = 'SMALL' as SizeType;
</script>

<template>
  <div v-if="tickerStore.status.overall == 'CONNECTING'" class="text-center">
    <h1 class="font-medium text-4xl">Connecting...</h1>
  </div>
  <div v-else-if="tickerStore.status.overall == 'CONNECTED'" class="flex flex-wrap justify-center m-auto w-full h-full">
    <div v-for="id in tickerIds" :key="id" class="w-1/2 h-1/2">
      <TickerBox :ticker-id="id" :box-size="boxSize" :r-link="id"></TickerBox>
    </div>
  </div>
</template>
