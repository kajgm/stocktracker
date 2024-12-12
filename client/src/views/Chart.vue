<script setup lang="ts">
import type { SizeType } from '@/types/types';
import TickerBox from '@/components/ticker/TickerBox.vue';

const { tickerId, tickerType } = defineProps<{
  tickerId: string;
  tickerType: string;
}>();
const boxSize = 'LARGE' as SizeType;
</script>

<template>
  <div class="flex flex-wrap justify-center m-auto w-full h-full">
    <TickerBox :ticker-id="tickerId" :ticker-type="tickerType" :box-size="boxSize" r-link="/"></TickerBox>
  </div>
</template>
