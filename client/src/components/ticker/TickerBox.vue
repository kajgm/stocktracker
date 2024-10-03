<script setup lang="ts">
import { useTickerStore } from '@/store/ticker';
import { concatNumber } from '@/helpers/helpers';
import { computed } from 'vue';
import type { TickerData, SizeType, TypeSizeMap } from '@/types/types';

const { tickerId, boxSize, rLink } = defineProps<{
  tickerId: string;
  boxSize: SizeType;
  rLink: string;
}>();

const tickerStore = useTickerStore();

const ticker = computed<TickerData>(() => {
  return tickerStore.tickerValue(tickerId);
});

const SizeMap: TypeSizeMap = {
  SMALL: {
    name: 'text-4xl',
    price: 'text-4xl max-w-40',
    status: 'text-4xl',
    padding: '',
    iconSize: 'h-5',
    info: 'text-2xl'
  },
  MEDIUM: {
    name: 'text-6xl',
    price: 'text-7xl',
    status: 'text-6xl',
    padding: 'pl-4 pt-6',
    iconSize: 'h-10',
    info: 'text-5xl pb-2'
  },
  LARGE: {
    name: 'text-6xl',
    price: 'text-7xl',
    status: 'text-6xl',
    padding: 'pl-4 pt-6',
    iconSize: 'h-10',
    info: 'text-5xl pb-2'
  }
};

const sInfo = SizeMap[boxSize];
</script>

<template>
  <div class="p-1.5 w-full h-full">
    <div class="bg-zinc-800 rounded-2xl w-full h-full overflow-hidden">
      <RouterLink :id="ticker.id" :to="rLink">
        <div class="p-2 h-full w-full flex flex-wrap flex-col">
          <h1 class="font-medium" :class="sInfo.name">{{ ticker.id }}</h1>
          <div v-if="ticker.status == 'CONNECTING'">
            <h1 class="font-medium" :class="sInfo.status">Connecting...</h1>
          </div>
          <div v-else-if="ticker.status == 'ERROR'">
            <h1 class="font-medium" :class="sInfo.status">Error</h1>
          </div>
          <div v-else-if="ticker.status == 'CONNECTED'" class="flex grow flex-wrap">
            <div class="inline-flex items-center text-center" :class="sInfo.padding">
              <svg class="w-auto" :class="[ticker.dirFilter, sInfo.iconSize]" viewBox="0 0 31.417 31.416">
                <path
                  d="M29.462 15.707a3.004 3.004 0 0 1-1.474 2.583L6.479 30.999c-.47.275-.998.417-1.526.417a2.98 2.98 0 0 1-1.487-.396 2.997 2.997 0 0 1-1.513-2.604V2.998A3.002 3.002 0 0 1 6.479.415l21.509 12.709a2.997 2.997 0 0 1 1.474 2.583z"
                />
              </svg>
              <h1 class="text-emerald-500 font-medium px-1" :class="sInfo.price">
                ${{ concatNumber(ticker.curPrice, 2, true, false) }}
              </h1>
            </div>
            <div class="grow flex h-auto items-end justify-end">
              <h1 class="font-medium text-left inline-block px-1 w-1/2" :class="sInfo.info">
                {{ concatNumber(ticker.volume, 2, false, true) }}
              </h1>
              <h1
                class="font-medium text-right inline-block px-1 w-1/2"
                :class="[ticker.dayPercentage >= 0 ? 'text-emerald-500' : 'text-red-500', sInfo.info]"
              >
                {{
                  Math.abs(ticker.dayPercentage) > 0.1
                    ? ticker.dayPercentage.toPrecision(3)
                    : ticker.dayPercentage.toPrecision(1)
                }}%
              </h1>
            </div>
          </div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
