import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { fetchHistory } from '@/api/history';
import type { HistoryPoint, HistoryRange } from '@/types/history';
import type { TickerData, TickerType } from '@/types/types';

const REFRESH_MS = 30_000;

/**
 * Chart history for one ticker: loads on mount and whenever the ticker or range
 * changes, refreshes every 30 s, and extends crypto lines with the live price.
 */
export function useTickerHistory(
  type: Ref<TickerType>,
  symbol: Ref<string>,
  range: Ref<HistoryRange>,
  ticker: Ref<TickerData>
) {
  const history = ref<HistoryPoint[]>([]);
  const state = ref<'loading' | 'ready' | 'error'>('loading');

  // Ignore responses for a ticker or range that is no longer shown.
  let request = 0;
  async function load() {
    const id = ++request;
    try {
      const res = await fetchHistory(type.value, symbol.value, range.value);
      if (id != request) return;
      history.value = res.points;
      state.value = 'ready';
    } catch {
      if (id != request) return;
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

  /** Price change across the range, in price units and percent. */
  const change = computed(() => {
    const p = points.value;
    if (p.length < 2 || !p[0][1]) return { amount: 0, percent: 0 };
    const amount = p.at(-1)![1] - p[0][1];
    return { amount, percent: (amount / p[0][1]) * 100 };
  });

  watch([type, symbol, range], () => {
    state.value = 'loading';
    history.value = [];
    void load();
  });

  let refresh: ReturnType<typeof setInterval> | undefined;
  onMounted(() => {
    void load();
    refresh = setInterval(() => void load(), REFRESH_MS);
  });
  onBeforeUnmount(() => clearInterval(refresh));

  return { points, state, change };
}
