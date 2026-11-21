<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useTickerStore } from '@/store/ticker';
import { now } from '@/helpers/now';
import { closeLabel, isUsMarketOpen } from '@/helpers/market';
import { errorHint, formatPercent, formatPrice, formatVolume } from '@/helpers/format';
import type { TickerData, SizeInfo } from '@/types/types';

const { tickerId, tickerType, rLink } = defineProps<{
  tickerId: string;
  tickerType: string;
  rLink: string;
}>();

/** No update for this long while the feed should be live fades the tile. */
const STALE_MS = { CRYPTO: 2 * 60_000, STOCK: 5 * 60_000 };
const FLASH_MS = 600;
/**
 * Crypto prices arrive every 500 ms, so flashing on every tick would keep the
 * tile lit permanently. Flash at most this often, against the price at the
 * previous flash.
 */
const FLASH_EVERY_MS = 5_000;

const tickerStore = useTickerStore();

const ticker = computed<TickerData>(() =>
  tickerType == 'CRYPTO' ? tickerStore.cryptoValue(tickerId) : tickerStore.stockValue(tickerId)
);
const sInfo = computed<SizeInfo>(() => tickerStore.tickerSizeInfo);

const live = computed(() => ticker.value.status == 'CONNECTED');
const closed = computed(() => live.value && ticker.value.type == 'STOCK' && !isUsMarketOpen(new Date(now.value)));
const staleMinutes = computed(() => {
  if (!live.value || closed.value) return 0;
  const age = now.value - ticker.value.receivedAt;
  return age > STALE_MS[ticker.value.type] ? Math.floor(age / 60_000) : 0;
});
const up = computed(() => ticker.value.dayPercentage >= 0);

const priceClass = computed(() => (closed.value ? 'text-zinc-300' : up.value ? 'text-emerald-500' : 'text-red-500'));
const footnote = computed(() => {
  const t = ticker.value;
  if (staleMinutes.value) return `${staleMinutes.value}m ago`;
  if (closed.value) return closeLabel(t.quoteTime, new Date(now.value));
  if (t.type == 'CRYPTO' && t.volume !== undefined) return formatVolume(t.volume, t.id);
  return '';
});

// Brief green/red flash when the price moves.
const flash = ref<'up' | 'down' | ''>('');
let flashTimer: ReturnType<typeof setTimeout> | undefined;
let lastFlashAt = 0;
let lastFlashPrice = -1;
watch(
  () => ticker.value.curPrice,
  (price) => {
    if (lastFlashPrice < 0) {
      lastFlashPrice = price; // first quote: nothing to compare against
      return;
    }
    const at = Date.now();
    if (price == lastFlashPrice || at - lastFlashAt < FLASH_EVERY_MS) return;
    flash.value = price > lastFlashPrice ? 'up' : 'down';
    lastFlashAt = at;
    lastFlashPrice = price;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => (flash.value = ''), FLASH_MS);
  },
  { immediate: true }
);
onBeforeUnmount(() => clearTimeout(flashTimer));

const boxClass = computed(() => {
  if (flash.value == 'up') return 'bg-emerald-950/60 ring-2 ring-inset ring-emerald-500';
  if (flash.value == 'down') return 'bg-red-950/60 ring-2 ring-inset ring-red-500';
  return 'bg-zinc-800';
});
</script>

<template>
  <div class="p-1.5 w-full h-full">
    <div
      class="rounded-2xl w-full h-full overflow-hidden transition-colors duration-300"
      :class="[boxClass, { 'opacity-50': staleMinutes }]"
      :data-state="staleMinutes ? 'stale' : closed ? 'closed' : ticker.status.toLowerCase()"
    >
      <RouterLink :to="rLink">
        <div class="p-2 h-full w-full flex flex-col">
          <div class="flex items-center justify-between gap-1">
            <h1 class="font-medium truncate" :class="sInfo.name">{{ ticker.id }}</h1>
            <span v-if="closed" class="shrink-0 rounded-md bg-zinc-700 px-1.5 text-xs font-medium text-zinc-300"
              >Closed</span
            >
          </div>
          <div v-if="ticker.status == 'CONNECTING'">
            <h1 class="font-medium" :class="sInfo.status">Connecting...</h1>
          </div>
          <div v-else-if="ticker.status == 'ERROR'" class="flex grow flex-col">
            <p class="font-medium text-red-400 break-words" :class="sInfo.error">{{ ticker.error || 'Error' }}</p>
            <p v-if="errorHint(ticker.error ?? '')" class="mt-auto text-zinc-400" :class="sInfo.vol">
              {{ errorHint(ticker.error ?? '') }}
            </p>
          </div>
          <div v-else class="flex grow flex-col">
            <h1 class="font-medium tabular-nums" :class="[priceClass, sInfo.price, sInfo.padding]">
              {{ formatPrice(ticker.curPrice) }}
            </h1>
            <div class="mt-auto flex items-end justify-between gap-1 font-medium">
              <span class="text-zinc-400 truncate" :class="sInfo.vol">{{ footnote }}</span>
              <span class="shrink-0 tabular-nums" :class="[up ? 'text-emerald-500' : 'text-red-500', sInfo.percent]">
                {{ up ? '&#9650;' : '&#9660;' }} {{ formatPercent(ticker.dayPercentage) }}
              </span>
            </div>
          </div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
