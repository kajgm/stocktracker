<script setup lang="ts">
import { useTickerStore } from '@/store/ticker';
import { type SizeType } from '@/types/types';
import TickerBox from '@/components/ticker/TickerBox.vue';

const tickerStore = useTickerStore();

const boxSize = 'SMALL' as SizeType;
</script>

<template>
  <div v-if="tickerStore.status.overall == 'CONNECTING'" class="text-center">
    <h1 class="font-medium text-4xl">Connecting...</h1>
  </div>
  <div v-else-if="tickerStore.status.overall == 'CONNECTED'" class="flex flex-wrap justify-center m-auto w-full h-full">
    <div v-for="id in tickerStore.tickerKeys" :key="id" class="w-1/2 h-1/2">
      <TickerBox :tickerId="id" :boxSize="boxSize" :rLink="id"></TickerBox>
    </div>
  </div>
</template>
