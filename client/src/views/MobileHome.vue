<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTickerStore } from '@/store/ticker';
import { useTickerHistory } from '@/composables/useTickerHistory';
import { now } from '@/helpers/now';
import { closeLabel, isUsMarketOpen } from '@/helpers/market';
import { formatPercent, formatPrice } from '@/helpers/format';
import PriceChart from '@/components/chart/PriceChart.vue';
import { HISTORY_RANGES, type HistoryRange } from '@/types/history';
import type { TickerData, TickerType } from '@/types/types';

/**
 * Phone layout: the selected ticker's chart on top, every ticker in a list
 * below. The route (/:tickerType/:tickerId) holds the selection, so it
 * survives a reload and can be shared.
 */
const props = defineProps<{
  tickerType?: string;
  tickerId?: string;
}>();

const router = useRouter();
const store = useTickerStore();

const all = computed<TickerData[]>(() => [
  ...store.cryptoKeys.map((id) => store.cryptoValue(id)),
  ...store.stockKeys.map((id) => store.stockValue(id))
]);

// The ticker in the route if it is configured, otherwise the first one.
const selected = computed<TickerData>(() => {
  const type = props.tickerType?.toUpperCase();
  return all.value.find((t) => t.type == type && t.id == props.tickerId) ?? all.value[0];
});
const type = computed<TickerType>(() => selected.value.type);
const symbol = computed(() => selected.value.id);

const range = ref<HistoryRange>('1d');
const { points, state, change } = useTickerHistory(type, symbol, range, selected);

const marketOpen = computed(() => isUsMarketOpen(new Date(now.value)));
const isClosed = (t: TickerData) => t.status == 'CONNECTED' && t.type == 'STOCK' && !marketOpen.value;
const isUp = (t: TickerData) => t.dayPercentage >= 0;

const status = computed(() => {
  const t = selected.value;
  if (t.status == 'ERROR') return { label: t.error || 'Error', dot: 'bg-red-400' };
  if (t.status == 'CONNECTING') return { label: 'Connecting...', dot: 'bg-zinc-500' };
  if (isClosed(t)) return { label: `Closed · ${closeLabel(t.quoteTime, new Date(now.value))}`, dot: 'bg-zinc-500' };
  return { label: 'Live', dot: 'bg-emerald-400' };
});

const price = computed(() => {
  const p = selected.value.curPrice > 0 ? selected.value.curPrice : points.value.at(-1)?.[1];
  return p ? formatPrice(p) : '—';
});

// Change over the chart's range; the day change until the chart has loaded.
const headline = computed(() => {
  if (points.value.length > 1) {
    const { amount, percent } = change.value;
    const sign = amount >= 0 ? '+' : '-';
    return {
      text: `${sign}${formatPrice(Math.abs(amount))} (${formatPercent(percent)}) · ${range.value.toUpperCase()}`,
      up: amount >= 0
    };
  }
  const t = selected.value;
  if (t.status != 'CONNECTED') return null;
  return { text: `${formatPercent(t.dayPercentage)} · Today`, up: isUp(t) };
});

const clock = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const dayClock = new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
const formatTime = (t: number) => (range.value == '5d' ? dayClock : clock).format(t);

function select(t: TickerData) {
  void router.replace({ name: 'chart', params: { tickerType: t.type, tickerId: t.id } });
}
const isSelected = (t: TickerData) => t.type == selected.value.type && t.id == selected.value.id;
</script>

<template>
  <div class="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col pt-[max(env(safe-area-inset-top),1rem)]">
    <header class="px-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <h1 class="truncate text-xl font-semibold text-zinc-100" data-testid="symbol">{{ selected.id }}</h1>
          <span class="h-2 w-2 shrink-0 rounded-full" :class="status.dot" aria-hidden="true"></span>
          <span class="truncate text-sm text-zinc-400">{{ status.label }}</span>
        </div>
        <RouterLink
          to="/settings"
          aria-label="Settings"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4" />
          </svg>
        </RouterLink>
      </div>
      <p class="mt-1 text-4xl font-semibold tracking-tight text-zinc-100 tabular-nums" data-testid="price">
        {{ price }}
      </p>
      <p
        class="mt-1 min-h-6 font-medium tabular-nums"
        :class="headline?.up ? 'text-emerald-400' : 'text-red-400'"
        data-testid="change"
      >
        {{ headline?.text }}
      </p>
    </header>

    <div class="relative mx-4 mt-3 h-56">
      <PriceChart
        v-if="points.length > 1"
        :points="points"
        :up="change.percent >= 0"
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

    <nav class="grid grid-cols-4 gap-1.5 px-4 pt-3" aria-label="Chart range">
      <button
        v-for="r in HISTORY_RANGES"
        :key="r"
        type="button"
        class="h-10 rounded-lg text-sm font-semibold uppercase"
        :class="r == range ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400'"
        :aria-pressed="r == range"
        @click="range = r"
      >
        {{ r }}
      </button>
    </nav>

    <section
      class="mt-4 flex-1 rounded-t-3xl bg-[#222225] px-2 pt-2 pb-[max(env(safe-area-inset-bottom),1rem)]"
      aria-label="Tickers"
    >
      <ul>
        <li v-for="t in all" :key="t.type + '/' + t.id">
          <button
            type="button"
            class="flex h-12 w-full items-center gap-2.5 rounded-xl px-2.5 text-left"
            :class="isSelected(t) ? 'bg-zinc-700/60' : 'active:bg-zinc-800'"
            :aria-current="isSelected(t) ? 'true' : undefined"
            :data-testid="'row-' + t.id"
            @click="select(t)"
          >
            <span class="w-24 truncate font-semibold text-zinc-100">{{ t.id }}</span>
            <span v-if="isClosed(t)" class="rounded-md bg-zinc-700 px-1.5 text-xs font-medium text-zinc-300"
              >Closed</span
            >
            <template v-if="t.status == 'CONNECTED'">
              <span class="ml-auto font-medium text-zinc-100 tabular-nums">{{ formatPrice(t.curPrice) }}</span>
              <span
                class="w-16 text-right text-sm font-semibold tabular-nums"
                :class="isUp(t) ? 'text-emerald-400' : 'text-red-400'"
                >{{ formatPercent(t.dayPercentage) }}</span
              >
            </template>
            <span v-else-if="t.status == 'ERROR'" class="ml-auto truncate text-sm text-red-400">{{
              t.error || 'Error'
            }}</span>
            <span v-else class="ml-auto text-sm text-zinc-400">Connecting...</span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
