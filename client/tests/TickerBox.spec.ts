import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { useTickerStore } from '@/store/ticker';
import { now } from '@/helpers/now';
import router from '@/router';
import TickerBox from '@/components/ticker/TickerBox.vue';

const SATURDAY = Date.parse('2026-11-21T15:00:00Z');
const MONDAY_OPEN = Date.parse('2026-11-23T16:00:00Z'); // 11:00 EST
const FRIDAY_CLOSE = Date.parse('2026-11-20T21:00:00Z');

function setNow(ms: number) {
  vi.setSystemTime(ms);
  now.value = ms;
}

function mountBox(id: string, type: 'STOCK' | 'CRYPTO') {
  return mount(TickerBox, {
    props: { tickerId: id, tickerType: type, rLink: '/' },
    global: { plugins: [router] }
  });
}

describe('TickerBox', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setActivePinia(createPinia());
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('colours a falling price red with a signed percentage', () => {
    setNow(SATURDAY);
    const store = useTickerStore();
    store.setTickers({ stock: [], crypto: ['BTC-USD'] });
    store.applyQuote({
      symbol: 'BTC-USD',
      type: 'CRYPTO',
      price: 60187.66,
      changePercent: -2.45,
      volume: 31812,
      timestamp: SATURDAY
    });
    const box = mountBox('BTC-USD', 'CRYPTO');
    expect(box.text()).toContain('$60,187.66');
    expect(box.text()).toContain('-2.45%');
    expect(box.text()).toContain('31.8k BTC');
    expect(box.find('.text-bad').exists()).toBe(true);
    expect(box.find('.text-ok').exists()).toBe(false);
  });

  it('marks stocks closed outside market hours with the close day', () => {
    setNow(SATURDAY);
    const store = useTickerStore();
    store.setTickers({ stock: ['AAPL'], crypto: [] });
    store.applyQuote({ symbol: 'AAPL', type: 'STOCK', price: 342.56, changePercent: 0.8, timestamp: FRIDAY_CLOSE });
    const box = mountBox('AAPL', 'STOCK');
    expect(box.text()).toContain('Closed');
    expect(box.text()).toContain('Fri close');
    expect(box.find('[data-state="closed"]').exists()).toBe(true);
  });

  it('fades a tile that stopped updating', async () => {
    setNow(MONDAY_OPEN);
    const store = useTickerStore();
    store.setTickers({ stock: [], crypto: ['ETH-USD'] });
    store.applyQuote({
      symbol: 'ETH-USD',
      type: 'CRYPTO',
      price: 1685.51,
      changePercent: -3.2,
      timestamp: MONDAY_OPEN
    });
    const box = mountBox('ETH-USD', 'CRYPTO');
    expect(box.find('[data-state="stale"]').exists()).toBe(false);

    setNow(MONDAY_OPEN + 3 * 60_000);
    await nextTick();
    expect(box.find('[data-state="stale"]').exists()).toBe(true);
    expect(box.text()).toContain('3m ago');
  });

  it('shows the error message and a hint', () => {
    setNow(SATURDAY);
    const store = useTickerStore();
    store.setTickers({ stock: ['XYZQ'], crypto: [] });
    store.applyError({ symbol: 'XYZQ', type: 'STOCK', message: 'Unknown symbol' });
    const box = mountBox('XYZQ', 'STOCK');
    expect(box.text()).toContain('Unknown symbol');
    expect(box.text()).toContain('Check the ticker list');
  });

  it('flashes when the price ticks, then settles', async () => {
    setNow(MONDAY_OPEN);
    const store = useTickerStore();
    store.setTickers({ stock: [], crypto: ['BTC-USD'] });
    store.applyQuote({ symbol: 'BTC-USD', type: 'CRYPTO', price: 100, changePercent: 1, timestamp: MONDAY_OPEN });
    const box = mountBox('BTC-USD', 'CRYPTO');

    store.applyQuote({ symbol: 'BTC-USD', type: 'CRYPTO', price: 101, changePercent: 2, timestamp: MONDAY_OPEN + 1 });
    await nextTick();
    expect(box.find('.border-ok').exists()).toBe(true);

    vi.advanceTimersByTime(700);
    await nextTick();
    expect(box.find('.border-ok').exists()).toBe(false);

    // Further ticks within 5 s don't flash again, so fast crypto feeds don't blink constantly.
    store.applyQuote({ symbol: 'BTC-USD', type: 'CRYPTO', price: 99, changePercent: 0, timestamp: MONDAY_OPEN + 2 });
    await nextTick();
    expect(box.find('.border-bad').exists()).toBe(false);

    vi.advanceTimersByTime(5_000);
    store.applyQuote({ symbol: 'BTC-USD', type: 'CRYPTO', price: 98, changePercent: 0, timestamp: MONDAY_OPEN + 3 });
    await nextTick();
    expect(box.find('.border-bad').exists()).toBe(true);
  });

  it('draws a one-day sparkline from the ticker history', async () => {
    setNow(SATURDAY);
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              points: [
                [SATURDAY - 60_000, 100],
                [SATURDAY, 110]
              ]
            })
        })
      )
    );
    const store = useTickerStore();
    store.setTickers({ stock: ['AAPL'], crypto: [] });
    store.applyQuote({ symbol: 'AAPL', type: 'STOCK', price: 110, changePercent: 1, timestamp: SATURDAY });
    const box = mountBox('AAPL', 'STOCK');
    await flushPromises();
    expect(box.get('[data-testid="spark"] path').attributes('d')).toBe('M0.00,100.00L100.00,0.00');
    vi.unstubAllGlobals();
  });
});
