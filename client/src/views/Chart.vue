<script setup lang="ts">
import TickerBox from '@/components/ticker/TickerBox.vue';

const { tickerId, tickerType } = defineProps<{
  tickerId: string;
  tickerType: string;
}>();
</script>

<template>
  <div class="flex flex-wrap justify-center m-auto w-full h-full">
    <TickerBox :ticker-id="tickerId" :ticker-type="tickerType" r-link="/"></TickerBox>
  </div>
</template>
