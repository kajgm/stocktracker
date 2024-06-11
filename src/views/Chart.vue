<script setup lang="ts">
import { useTickerStore } from '@/store/ticker';
import { concatNumber } from '@/helpers/helpers';
import { computed } from 'vue';
import type { TickerData } from '@/types/types';

const tickerStore = useTickerStore();

const { tickerId } = defineProps<{
  tickerId: string;
}>();

const ticker = computed<TickerData>(() => {
  return tickerStore.tickerValue(tickerId);
});
</script>

<template>
  <div class="flex flex-wrap justify-center m-auto w-full h-full">
    <div class="p-2 w-full h-full">
      <div class="bg-zinc-800 rounded-2xl w-full h-full">
        <RouterLink to="/">
          <div class="p-2 h-full w-full flex flex-wrap flex-col">
            <h1 class="font-medium text-6xl">{{ ticker.id }}</h1>
            <div v-if="ticker.status == 'CONNECTING'">
              <h1 class="font-medium text-4xl">Connecting...</h1>
            </div>
            <div v-else-if="ticker.status == 'ERROR'">
              <h1 class="font-medium text-4xl">Error</h1>
            </div>
            <div v-else-if="ticker.status == 'CONNECTED'" class="flex grow flex-wrap">
              <div class="inline-flex items-center text-center pl-4 pt-8">
                <svg class="h-10 w-auto" :class="ticker.dirFilter" viewBox="0 0 31.417 31.416">
                  <path
                    d="M29.462 15.707a3.004 3.004 0 0 1-1.474 2.583L6.479 30.999c-.47.275-.998.417-1.526.417a2.98 2.98 0 0 1-1.487-.396 2.997 2.997 0 0 1-1.513-2.604V2.998A3.002 3.002 0 0 1 6.479.415l21.509 12.709a2.997 2.997 0 0 1 1.474 2.583z"
                  />
                </svg>
                <h1 class="text-emerald-500 font-medium text-7xl px-1">
                  ${{ concatNumber(ticker.curPrice, 2, true, false) }}
                </h1>
              </div>
              <div class="grow flex h-auto items-end justify-end">
                <h1 class="font-medium text-5xl text-left inline-block px-1 w-1/2">
                  {{ concatNumber(ticker.volume, 2, false, true) }}
                </h1>
                <h1
                  class="font-medium text-5xl text-right inline-block px-1 w-1/2"
                  :class="[ticker.dayPercentage >= 0 ? 'text-emerald-500' : 'text-red-500']"
                >
                  {{ ticker.dayPercentage.toPrecision(3) }}%
                </h1>
              </div>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
