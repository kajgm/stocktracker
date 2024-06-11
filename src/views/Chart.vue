<script setup lang="ts">
import { useTickerStore } from '@/store/ticker';
import { computed } from 'vue';
import type { TickerData, SizeType } from '@/types/types';
import TickerBox from '@/components/ticker/TickerBox.vue';

const tickerStore = useTickerStore();

const boxSize = 'LARGE' as SizeType;

const { tickerId } = defineProps<{
  tickerId: string;
}>();

const ticker = computed<TickerData>(() => {
  return tickerStore.tickerValue(tickerId);
});
</script>

<template>
  <div class="flex flex-wrap justify-center m-auto w-full h-full">
    <TickerBox :tickerId="ticker.id" :boxSize="boxSize" rLink="/"></TickerBox>
  </div>
</template>
