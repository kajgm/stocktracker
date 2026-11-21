<script setup lang="ts">
import { computed } from 'vue';
import { useTickerStore } from '@/store/ticker';
import type { SizeInfo } from '@/types/types';
import TickerBox from '@/components/ticker/TickerBox.vue';

const tickerStore = useTickerStore();
const sInfo = computed<SizeInfo>(() => tickerStore.tickerSizeInfo);
</script>

<template>
  <div class="flex flex-wrap justify-center m-auto w-full h-full">
    <div v-for="id in tickerStore.cryptoKeys" :key="'CRYPTO/' + id" :class="[sInfo.boxSize.X, sInfo.boxSize.Y]">
      <TickerBox :ticker-id="id" ticker-type="CRYPTO" :r-link="'/CRYPTO/' + id"></TickerBox>
    </div>
    <div v-for="id in tickerStore.stockKeys" :key="'STOCK/' + id" :class="[sInfo.boxSize.X, sInfo.boxSize.Y]">
      <TickerBox :ticker-id="id" ticker-type="STOCK" :r-link="'/STOCK/' + id"></TickerBox>
    </div>
  </div>
</template>
