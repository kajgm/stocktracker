import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import router from '@/router';
import Chart from '@/views/Chart.vue';
import type { TickerHistory } from '@/types/history';

const T0 = Date.parse('2026-11-20T15:00:00Z');

function mockHistory(body: Partial<TickerHistory> | null, status = 200) {
  const fetchMock = vi.fn(() => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function mountChart(type: string, id: string) {
  const wrapper = mount(Chart, { props: { tickerType: type, tickerId: id }, global: { plugins: [router] } });
  await flushPromises();
  return wrapper;
}

describe('Chart view', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the 1d history and shows the change over the range', async () => {
    const fetchMock = mockHistory({
      points: [
        [T0, 100],
        [T0 + 60_000, 95]
      ]
    });
    const wrapper = await mountChart('STOCK', 'AAPL');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/history/stock/AAPL?range=1d'),
      expect.anything()
    );
    expect(wrapper.get('[data-testid="change"]').text()).toBe('-5.00%');
    expect(wrapper.get('[data-testid="change"]').classes()).toContain('text-red-500');
  });

  it('reloads when the range changes', async () => {
    const fetchMock = mockHistory({ points: [] });
    const wrapper = await mountChart('CRYPTO', 'BTC-USD');
    await wrapper
      .findAll('nav button')
      .find((b) => b.text() == '5d')!
      .trigger('click');
    await flushPromises();
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/history/crypto/BTC-USD?range=5d'),
      expect.anything()
    );
  });

  it('explains an empty stock chart', async () => {
    mockHistory({ points: [] });
    const wrapper = await mountChart('STOCK', 'AAPL');
    expect(wrapper.text()).toContain('Stock charts fill in while the market is open');
  });

  it('says when history fails to load', async () => {
    mockHistory(null, 500);
    const wrapper = await mountChart('STOCK', 'AAPL');
    expect(wrapper.text()).toContain("Couldn't load the chart");
  });
});
