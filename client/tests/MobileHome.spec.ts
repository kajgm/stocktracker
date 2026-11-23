import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { useTickerStore } from '@/store/ticker';
import { isPhone } from '@/helpers/viewport';
import router from '@/router';
import App from '@/App.vue';

const T0 = Date.parse('2026-11-20T15:00:00Z');

function mockHistory(points: [number, number][]) {
  const fetchMock = vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ points }) }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function seedTickers() {
  const store = useTickerStore();
  store.connection = 'CONNECTED';
  store.setTickers({ crypto: ['BTC-USD'], stock: ['AAPL'] });
  store.applyQuote({ symbol: 'BTC-USD', type: 'CRYPTO', price: 98412.5, changePercent: 2.14, timestamp: T0 });
  store.applyQuote({ symbol: 'AAPL', type: 'STOCK', price: 231.4, changePercent: -0.88, timestamp: T0 });
}

let mounted: VueWrapper | undefined;

async function mountAt(path: string) {
  await router.push(path);
  await router.isReady();
  const wrapper = mount(App, { global: { plugins: [router] } });
  mounted = wrapper;
  await flushPromises();
  return wrapper;
}

describe('Phone layout', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    isPhone.value = true;
  });
  afterEach(() => {
    mounted?.unmount();
    mounted = undefined;
    isPhone.value = false;
    vi.unstubAllGlobals();
  });

  it('shows the first ticker and lists every ticker', async () => {
    const fetchMock = mockHistory([]);
    seedTickers();
    const wrapper = await mountAt('/');
    expect(wrapper.get('[data-testid="symbol"]').text()).toBe('BTC-USD');
    expect(wrapper.get('[data-testid="price"]').text()).toBe('$98,412.50');
    expect(wrapper.find('[data-testid="row-BTC-USD"]').attributes('aria-current')).toBe('true');
    expect(wrapper.get('[data-testid="row-AAPL"]').text()).toContain('$231.40');
    expect(wrapper.get('[data-testid="row-AAPL"]').text()).toContain('-0.88%');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/history/crypto/BTC-USD?range=1d'),
      expect.anything()
    );
  });

  it('selects the ticker in the route', async () => {
    mockHistory([]);
    seedTickers();
    const wrapper = await mountAt('/STOCK/AAPL');
    expect(wrapper.get('[data-testid="symbol"]').text()).toBe('AAPL');
  });

  it('switches the chart when a row is tapped', async () => {
    const fetchMock = mockHistory([]);
    seedTickers();
    const wrapper = await mountAt('/');
    await wrapper.get('[data-testid="row-AAPL"]').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/STOCK/AAPL');
    expect(wrapper.get('[data-testid="symbol"]').text()).toBe('AAPL');
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/history/stock/AAPL?range=1d'),
      expect.anything()
    );
  });

  it('shows the change over the chart range', async () => {
    mockHistory([
      [T0, 100],
      [T0 + 60_000, 95]
    ]);
    const store = useTickerStore();
    store.connection = 'CONNECTED';
    store.setTickers({ crypto: [], stock: ['AAPL'] });
    store.applyQuote({ symbol: 'AAPL', type: 'STOCK', price: 95, changePercent: -1, timestamp: T0 });
    const wrapper = await mountAt('/');
    const change = wrapper.get('[data-testid="change"]');
    expect(change.text()).toBe('-$5.00 (-5.00%)');
    expect(change.classes()).toContain('text-bad');
  });

  it('keeps the tile grid on the kiosk display', async () => {
    isPhone.value = false;
    mockHistory([]);
    seedTickers();
    const wrapper = await mountAt('/');
    expect(wrapper.find('[data-testid="symbol"]').exists()).toBe(false);
    expect(wrapper.find('.w-pi-w').exists()).toBe(true);
  });
});
