<script setup lang="ts">
import { useTickerStore } from '@/store/ticker';
import { computed } from 'vue';
import type { TickerData, SizeType } from '@/types/types';
import TickerBox from '@/components/ticker/TickerBox.vue';

const { tickerId } = defineProps<{
  tickerId: string;
}>();

const tickerStore = useTickerStore();

const boxSize = 'LARGE' as SizeType;

const ticker = computed<TickerData>(() => {
  return tickerStore.tickerValue(tickerId);
});
</script>

<template>
  <div class="flex flex-wrap justify-center m-auto w-full h-full">
    <TickerBox :ticker-id="ticker.id" :box-size="boxSize" r-link="/"></TickerBox>
  </div>
</template>
