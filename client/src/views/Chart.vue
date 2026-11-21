<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTickerStore } from '@/store/ticker';
import { fetchHistory } from '@/api/history';
import PriceChart from '@/components/chart/PriceChart.vue';
import { HISTORY_RANGES, type HistoryPoint, type HistoryRange } from '@/types/history';
import type { TickerData, TickerType } from '@/types/types';

const { tickerId, tickerType } = defineProps<{
  tickerId: string;
  tickerType: string;
}>();

const REFRESH_MS = 30_000;
/** On the kiosk, go back to the grid if nobody touches the chart for this long. */
const IDLE_RETURN_MS = 5 * 60_000;

const router = useRouter();
const tickerStore = useTickerStore();
const type = computed<TickerType>(() => (tickerType.toUpperCase() == 'CRYPTO' ? 'CRYPTO' : 'STOCK'));
const ticker = computed<TickerData>(() =>
  type.value == 'CRYPTO' ? tickerStore.cryptoValue(tickerId) : tickerStore.stockValue(tickerId)
);

const range = ref<HistoryRange>('1d');
const history = ref<HistoryPoint[]>([]);
const state = ref<'loading' | 'ready' | 'error'>('loading');

async function load() {
  try {
    const res = await fetchHistory(type.value, tickerId, range.value);
    history.value = res.points;
    state.value = 'ready';
  } catch {
    // Keep showing what we had; only say so when there's nothing to show.
    if (!history.value.length) state.value = 'error';
  }
}

// Crypto streams continuously: extend the line with the live price between refreshes.
// Stocks don't, or a closed market would draw a flat line up to now.
const points = computed<HistoryPoint[]>(() => {
  const t = ticker.value;
  const last = history.value.at(-1);
  if (type.value == 'CRYPTO' && last && t.status == 'CONNECTED' && t.curPrice > 0) {
    const nowMs = Date.now();
    if (nowMs > last[0]) return [...history.value, [nowMs, t.curPrice]];
  }
  return history.value;
});

const change = computed(() => {
  const p = points.value;
  if (p.length < 2 || !p[0][1]) return 0;
  return ((p.at(-1)![1] - p[0][1]) / p[0][1]) * 100;
});
const up = computed(() => change.value >= 0);

const priceFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const smallPriceFormat = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 4 });
const formatPrice = (p: number) => `$${p >= 1 ? priceFormat.format(p) : smallPriceFormat.format(p)}`;
const clock = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const dayClock = new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
const formatTime = (t: number) => (range.value == '5d' ? dayClock : clock).format(t);
const formatChange = (c: number) => `${c >= 0 ? '+' : '-'}${Math.abs(c).toFixed(2)}%`;

const latestPrice = computed(() => (ticker.value.curPrice > 0 ? ticker.value.curPrice : points.value.at(-1)?.[1]));

let refresh: ReturnType<typeof setInterval> | undefined;
let idle: ReturnType<typeof setTimeout> | undefined;
function resetIdle() {
  clearTimeout(idle);
  idle = setTimeout(() => void router.push('/'), IDLE_RETURN_MS);
}

watch(range, () => {
  state.value = 'loading';
  history.value = [];
  void load();
});
onMounted(() => {
  void load();
  refresh = setInterval(() => void load(), REFRESH_MS);
  resetIdle();
});
onBeforeUnmount(() => {
  clearInterval(refresh);
  clearTimeout(idle);
});
</script>

<template>
  <div class="flex h-full w-full flex-col p-2" @pointerdown="resetIdle">
    <header class="flex items-baseline gap-2">
      <RouterLink to="/" class="text-2xl leading-none text-zinc-400" aria-label="Back to all tickers"
        >&lsaquo;</RouterLink
      >
      <h1 class="text-2xl font-medium">{{ tickerId }}</h1>
      <span
        v-if="latestPrice"
        class="text-2xl font-medium tabular-nums"
        :class="up ? 'text-emerald-500' : 'text-red-500'"
      >
        {{ formatPrice(latestPrice) }}
      </span>
      <span
        v-if="points.length > 1"
        class="ml-auto text-lg font-medium tabular-nums"
        :class="up ? 'text-emerald-500' : 'text-red-500'"
        data-testid="change"
      >
        {{ formatChange(change) }}
      </span>
    </header>

    <div class="relative mt-1 min-h-0 flex-1">
      <PriceChart
        v-if="points.length > 1"
        :points="points"
        :up="up"
        :format-price="formatPrice"
        :format-time="formatTime"
      />
      <p v-else class="absolute inset-0 flex items-center justify-center text-center text-zinc-400">
        <template v-if="state == 'loading'">Loading chart...</template>
        <template v-else-if="state == 'error'">Couldn't load the chart. Retrying...</template>
        <template v-else-if="type == 'STOCK'">No history yet. Stock charts fill in while the market is open.</template>
        <template v-else>No history yet.</template>
      </p>
    </div>

    <nav class="mt-1 flex justify-center gap-1" aria-label="Chart range">
      <button
        v-for="r in HISTORY_RANGES"
        :key="r"
        type="button"
        class="rounded-md px-3 py-0.5 text-sm font-medium uppercase"
        :class="r == range ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400'"
        :aria-pressed="r == range"
        @click="range = r"
      >
        {{ r }}
      </button>
    </nav>
  </div>
</template>
