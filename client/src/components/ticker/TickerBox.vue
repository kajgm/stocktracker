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

const priceClass = computed(() => (closed.value ? 'text-ink-2' : 'text-ink'));
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
  if (flash.value == 'up') return 'bg-ok-soft border-ok';
  if (flash.value == 'down') return 'bg-bad-soft border-bad';
  return 'bg-paper-2 border-rule';
});
</script>

<template>
  <div class="p-1 w-full h-full">
    <div
      class="rounded-card border w-full h-full overflow-hidden transition-colors duration-300"
      :class="[boxClass, { 'opacity-50': staleMinutes }]"
      :data-state="staleMinutes ? 'stale' : closed ? 'closed' : ticker.status.toLowerCase()"
    >
      <RouterLink :to="rLink" class="block h-full rounded-card focus-visible:outline-offset-[-2px]">
        <div class="p-2 h-full w-full flex flex-col">
          <div class="flex items-center justify-between gap-1">
            <h1 class="font-medium text-ink-2 truncate" :class="sInfo.name">{{ ticker.id }}</h1>
            <span
              v-if="closed"
              class="shrink-0 rounded border border-rule px-1.5 text-xs font-medium leading-5 text-muted"
              >Closed</span
            >
          </div>
          <div v-if="ticker.status == 'CONNECTING'">
            <p class="font-medium text-muted" :class="sInfo.status">Connecting...</p>
          </div>
          <div v-else-if="ticker.status == 'ERROR'" class="flex grow flex-col">
            <p class="font-medium text-bad break-words" :class="sInfo.error">{{ ticker.error || 'Error' }}</p>
            <p v-if="errorHint(ticker.error ?? '')" class="mt-auto text-muted" :class="sInfo.vol">
              {{ errorHint(ticker.error ?? '') }}
            </p>
          </div>
          <div v-else class="flex grow flex-col">
            <p class="measured leading-none tracking-tight" :class="[priceClass, sInfo.price, sInfo.padding]">
              {{ formatPrice(ticker.curPrice) }}
            </p>
            <div class="mt-auto flex items-end justify-between gap-1">
              <span class="measured text-muted truncate" :class="sInfo.vol">{{ footnote }}</span>
              <span class="measured shrink-0" :class="[up ? 'text-ok' : 'text-bad', sInfo.percent]">
                {{ up ? '&#9650;' : '&#9660;' }} {{ formatPercent(ticker.dayPercentage) }}
              </span>
            </div>
          </div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
