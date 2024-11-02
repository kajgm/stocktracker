<script setup lang="ts">
import { computed } from 'vue';
import { useTickerStore } from '@/store/ticker';
import { type SizeType } from '@/types/types';
import TickerBox from '@/components/ticker/TickerBox.vue';

const appVersion = process.env.appVersion;
const tickerStore = useTickerStore();
const cryptoIds = computed<string[]>(() => {
  return tickerStore.cryptoKeys;
});
const stockIds = computed<string[]>(() => {
  return tickerStore.stockKeys;
});
const boxSize = 'SMALL' as SizeType;
</script>

<template>
  <div v-if="tickerStore.status.overall == 'CONNECTING'" class="text-center">
    <h1 class="font-medium text-4xl">Connecting...</h1>
  </div>
  <div v-else-if="tickerStore.status.overall == 'CONNECTED'" class="flex flex-wrap justify-center m-auto w-full h-full">
    <div class="absolute left-[calc(50%-16px)] top-[calc(50%-8px)] text-xs text-zinc-600">v{{ appVersion }}</div>
    <div v-for="id in cryptoIds" :key="id" class="w-1/2 h-1/2">
      <TickerBox :ticker-id="id" ticker-type="CRYPTO" :box-size="boxSize" :r-link="id"></TickerBox>
    </div>
    <div v-for="id in stockIds" :key="id" class="w-1/2 h-1/2">
      <TickerBox :ticker-id="id" ticker-type="STOCK" :box-size="boxSize" :r-link="id"></TickerBox>
    </div>
  </div>
</template>
