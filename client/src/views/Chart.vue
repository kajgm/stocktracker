<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRef } from 'vue';
import { useRouter } from 'vue-router';
import { useTickerStore } from '@/store/ticker';
import { useTickerHistory } from '@/composables/useTickerHistory';
import { formatPercent, formatPrice } from '@/helpers/format';
import PriceChart from '@/components/chart/PriceChart.vue';
import { HISTORY_RANGES, type HistoryRange } from '@/types/history';
import type { TickerData, TickerType } from '@/types/types';

const props = defineProps<{
  tickerId: string;
  tickerType: string;
}>();

/** On the kiosk, go back to the grid if nobody touches the chart for this long. */
const IDLE_RETURN_MS = 5 * 60_000;

const router = useRouter();
const tickerStore = useTickerStore();
const type = computed<TickerType>(() => (props.tickerType.toUpperCase() == 'CRYPTO' ? 'CRYPTO' : 'STOCK'));
const ticker = computed<TickerData>(() =>
  type.value == 'CRYPTO' ? tickerStore.cryptoValue(props.tickerId) : tickerStore.stockValue(props.tickerId)
);

const range = ref<HistoryRange>('1d');
const { points, state, change } = useTickerHistory(type, toRef(props, 'tickerId'), range, ticker);
const up = computed(() => change.value.percent >= 0);

const clock = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const dayClock = new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
const formatTime = (t: number) => (range.value == '5d' ? dayClock : clock).format(t);

const latestPrice = computed(() => (ticker.value.curPrice > 0 ? ticker.value.curPrice : points.value.at(-1)?.[1]));

let idle: ReturnType<typeof setTimeout> | undefined;
function resetIdle() {
  clearTimeout(idle);
  idle = setTimeout(() => void router.push('/'), IDLE_RETURN_MS);
}
onMounted(resetIdle);
onBeforeUnmount(() => clearTimeout(idle));
</script>

<template>
  <div class="flex h-full w-full flex-col p-2" @pointerdown="resetIdle">
    <header class="flex items-baseline gap-2">
      <RouterLink
        to="/"
        class="rounded-pill px-1 text-2xl leading-none text-muted hover:text-ink"
        aria-label="Back to all tickers"
        >&lsaquo;</RouterLink
      >
      <h1 class="text-xl text-ink-2">{{ tickerId }}</h1>
      <span v-if="latestPrice" class="measured text-2xl text-ink">
        {{ formatPrice(latestPrice) }}
      </span>
      <span
        v-if="points.length > 1"
        class="measured ml-auto text-lg"
        :class="up ? 'text-ok' : 'text-bad'"
        data-testid="change"
      >
        {{ formatPercent(change.percent) }}
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
      <p v-else class="absolute inset-0 flex items-center justify-center text-center text-muted">
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
        class="h-8 min-w-12 rounded border px-3 text-sm font-medium transition-colors"
        :class="r == range ? 'border-cool bg-cool-soft text-cool' : 'border-transparent text-muted hover:text-ink'"
        :aria-pressed="r == range"
        @click="range = r"
      >
        {{ r }}
      </button>
    </nav>
  </div>
</template>
