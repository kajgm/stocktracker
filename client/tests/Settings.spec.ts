import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import router from '@/router';
import Settings from '@/views/Settings.vue';
import { useTickerStore } from '@/store/ticker';
import { checkTicker } from '@/helpers/tickers';

type Reply = { status: number; body: unknown };

/** fetch stub: GET returns `lists`; PUT returns the next queued reply (default: echo the body). */
function stubApi(lists = { stock: ['AAPL', 'MSFT'], crypto: ['BTC-USD'] }, putReplies: Reply[] = []) {
  const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
    const reply: Reply =
      init?.method == 'PUT'
        ? putReplies.shift() ?? { status: 200, body: JSON.parse(init.body as string) as unknown }
        : { status: 200, body: lists };
    return Promise.resolve({
      ok: reply.status < 400,
      status: reply.status,
      json: () => Promise.resolve(reply.body)
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function mountSettings() {
  const wrapper = mount(Settings, { global: { plugins: [router] } });
  await flushPromises();
  return wrapper;
}

const items = (wrapper: Awaited<ReturnType<typeof mountSettings>>, key: string) =>
  wrapper.findAll(`[data-testid="${key}-list"] li`).map((li) => li.text().split(/\s+/)[0]);

describe('Settings', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // Node 26 has its own localStorage global that shadows jsdom's; use a simple in-memory one.
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, String(v)),
      removeItem: (k: string) => void data.delete(k),
      clear: () => data.clear()
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the current lists and shows each ticker status', async () => {
    stubApi();
    const store = useTickerStore();
    store.setTickers({ stock: ['AAPL', 'MSFT'], crypto: ['BTC-USD'] });
    store.applyQuote({ symbol: 'AAPL', type: 'STOCK', price: 1, changePercent: 0, timestamp: 0 });
    const wrapper = await mountSettings();
    expect(items(wrapper, 'stock')).toEqual(['AAPL', 'MSFT']);
    expect(items(wrapper, 'crypto')).toEqual(['BTC-USD']);
    expect(wrapper.get('[data-testid="stock-list"]').text()).toContain('Live');
    expect(wrapper.get('[data-testid="stock-list"]').text()).toContain('Waiting');
  });

  it('adds, reorders and removes tickers, then saves both lists with the token', async () => {
    const fetchMock = stubApi();
    const wrapper = await mountSettings();
    const save = wrapper.get('button[type="submit"]');
    expect(save.attributes('disabled')).toBeDefined(); // nothing changed yet

    await wrapper.get('input[aria-label="Add a stocks ticker"]').setValue('nvda');
    await wrapper.get('input[aria-label="Add a stocks ticker"]').trigger('keydown', { key: 'Enter' });
    await wrapper.get('button[aria-label="Move NVDA up"]').trigger('click');
    await wrapper.get('button[aria-label="Remove AAPL"]').trigger('click');
    expect(items(wrapper, 'stock')).toEqual(['NVDA', 'MSFT']);

    await wrapper.get('input[aria-label="Admin token"]').setValue('s3cret');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(url).toBe('/api/tickers');
    expect(init).toMatchObject({ method: 'PUT', headers: { Authorization: 'Bearer s3cret' } });
    expect(JSON.parse(init!.body as string)).toEqual({ stock: ['NVDA', 'MSFT'], crypto: ['BTC-USD'] });
    expect(wrapper.text()).toContain('Saved');
    expect(localStorage.getItem('stocktracker.adminToken')).toBeNull(); // not remembered unless ticked
  });

  it('remembers the token only when asked', async () => {
    stubApi();
    const wrapper = await mountSettings();
    await wrapper.get('button[aria-label="Remove MSFT"]').trigger('click');
    await wrapper.get('input[aria-label="Admin token"]').setValue('s3cret');
    await wrapper.get('input[type="checkbox"]').setValue(true);
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(localStorage.getItem('stocktracker.adminToken')).toBe('s3cret');
  });

  it('explains a rejected token and keeps the unsaved changes', async () => {
    stubApi(undefined, [{ status: 401, body: { error: 'Unauthorized' } }]);
    const wrapper = await mountSettings();
    await wrapper.get('button[aria-label="Remove MSFT"]').trigger('click');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.text()).toContain('The admin token is wrong or missing.');
    expect(items(wrapper, 'stock')).toEqual(['AAPL']);
    expect(wrapper.text()).toContain('Discard changes');
  });

  it('rejects malformed and duplicate symbols before saving', async () => {
    stubApi();
    const wrapper = await mountSettings();
    await wrapper.get('input[aria-label="Add a crypto ticker"]').setValue('BTCUSD');
    await wrapper
      .findAll('button')
      .find((b) => b.text() == 'Add' && b.element.closest('section')?.textContent?.includes('Crypto'))!
      .trigger('click');
    expect(wrapper.text()).toContain('Use a Coinbase product like BTC-USD');
    expect(items(wrapper, 'crypto')).toEqual(['BTC-USD']);
  });
});

describe('checkTicker', () => {
  it('normalises and validates symbols', () => {
    expect(checkTicker(' brk.b ', 'STOCK', [])).toEqual({ symbol: 'BRK.B' });
    expect(checkTicker('eth-usd', 'CRYPTO', [])).toEqual({ symbol: 'ETH-USD' });
    expect(checkTicker('AAPL', 'STOCK', ['AAPL'])).toEqual({ error: 'AAPL is already in the list' });
    expect(checkTicker('', 'STOCK', [])).toEqual({ error: 'Enter a symbol' });
    expect(checkTicker('NOT VALID', 'STOCK', [])).toEqual({ error: 'Use a US stock symbol like AAPL' });
  });
});
