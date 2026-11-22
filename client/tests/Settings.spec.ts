import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import router from '@/router';
import Settings from '@/views/Settings.vue';
import { useTickerStore } from '@/store/ticker';
import { checkTicker } from '@/helpers/tickers';

type Reply = { status: number; body: unknown };

/**
 * fetch stub: GET /api/tickers returns `lists`; GET /api/auth accepts `adminToken`
 * (any request when it is ''); PUT returns the next queued reply (default: echo the body).
 */
function stubApi({
  lists = { stock: ['AAPL', 'MSFT'], crypto: ['BTC-USD'] },
  putReplies = [] as Reply[],
  adminToken = 's3cret'
} = {}) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const authorization = (init?.headers as Record<string, string> | undefined)?.Authorization;
    let reply: Reply;
    if (init?.method == 'PUT') {
      reply = putReplies.shift() ?? { status: 200, body: JSON.parse(init.body as string) as unknown };
    } else if (url.endsWith('/api/auth')) {
      reply =
        adminToken && authorization != `Bearer ${adminToken}`
          ? { status: 401, body: { error: 'Unauthorized' } }
          : { status: 200, body: { required: Boolean(adminToken) } };
    } else {
      reply = { status: 200, body: lists };
    }
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

type Wrapper = Awaited<ReturnType<typeof mountSettings>>;

const items = (wrapper: Wrapper, key: string) =>
  wrapper.findAll(`[data-testid="${key}-list"] li`).map((li) => li.text().split(/\s+/)[0]);

async function unlock(wrapper: Wrapper, token = 's3cret', remember = false) {
  await wrapper.get('input[aria-label="Admin token"]').setValue(token);
  if (remember) await wrapper.get('input[type="checkbox"]').setValue(true);
  await wrapper.get('form').trigger('submit'); // the unlock form comes first while locked
  await flushPromises();
}

const editable = (wrapper: Wrapper) => wrapper.find('button[aria-label="Remove AAPL"]').exists();

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

  it('stays locked until a valid token is entered', async () => {
    stubApi();
    const wrapper = await mountSettings();
    expect(items(wrapper, 'stock')).toEqual(['AAPL', 'MSFT']); // read-only lists still show
    expect(editable(wrapper)).toBe(false);
    expect(wrapper.find('input[aria-label="Add a stocks ticker"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Save');

    await unlock(wrapper, 'wrong');
    expect(wrapper.text()).toContain('That token is wrong.');
    expect(editable(wrapper)).toBe(false);

    await unlock(wrapper);
    expect(editable(wrapper)).toBe(true);
    expect(wrapper.text()).toContain('Editing unlocked');
  });

  it('adds, reorders and removes tickers, then saves both lists with the token', async () => {
    const fetchMock = stubApi();
    const wrapper = await mountSettings();
    await unlock(wrapper);
    const save = wrapper.get('button[type="submit"]');
    expect(save.attributes('disabled')).toBeDefined(); // nothing changed yet

    await wrapper.get('input[aria-label="Add a stocks ticker"]').setValue('nvda');
    await wrapper.get('input[aria-label="Add a stocks ticker"]').trigger('keydown', { key: 'Enter' });
    await wrapper.get('button[aria-label="Move NVDA up"]').trigger('click');
    await wrapper.get('button[aria-label="Remove AAPL"]').trigger('click');
    expect(items(wrapper, 'stock')).toEqual(['NVDA', 'MSFT']);

    await wrapper.get('button[type="submit"]').trigger('submit');
    await flushPromises();

    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(url).toBe('/api/tickers');
    expect(init).toMatchObject({ method: 'PUT', headers: { Authorization: 'Bearer s3cret' } });
    expect(JSON.parse(init!.body as string)).toEqual({ stock: ['NVDA', 'MSFT'], crypto: ['BTC-USD'] });
    expect(wrapper.text()).toContain('Saved');
    expect(localStorage.getItem('stocktracker.adminToken')).toBeNull(); // not remembered unless ticked
  });

  it('remembers the token only when asked, and unlocks with it next time', async () => {
    stubApi();
    const first = await mountSettings();
    await unlock(first, 's3cret', true);
    expect(localStorage.getItem('stocktracker.adminToken')).toBe('s3cret');
    first.unmount();

    const again = await mountSettings();
    expect(editable(again)).toBe(true);
    expect(again.text()).toContain('remembered on this device');
  });

  it('asks again when the remembered token no longer works', async () => {
    stubApi();
    localStorage.setItem('stocktracker.adminToken', 'old');
    const wrapper = await mountSettings();
    expect(editable(wrapper)).toBe(false);
    expect(wrapper.text()).toContain('The remembered token no longer works');
    expect(localStorage.getItem('stocktracker.adminToken')).toBeNull();
  });

  it('needs no token when the server has none', async () => {
    stubApi({ adminToken: '' });
    const wrapper = await mountSettings();
    expect(editable(wrapper)).toBe(true);
    expect(wrapper.text()).not.toContain('Unlock');
    expect(wrapper.text()).not.toContain('Lock');
  });

  it('locks again and forgets the token', async () => {
    stubApi();
    const wrapper = await mountSettings();
    await unlock(wrapper, 's3cret', true);
    await wrapper
      .findAll('button')
      .find((b) => b.text() == 'Lock')!
      .trigger('click');
    expect(editable(wrapper)).toBe(false);
    expect(localStorage.getItem('stocktracker.adminToken')).toBeNull();
  });

  it('asks for the token again when a save is rejected, keeping the unsaved changes', async () => {
    stubApi({ putReplies: [{ status: 401, body: { error: 'Unauthorized' } }] });
    const wrapper = await mountSettings();
    await unlock(wrapper);
    await wrapper.get('button[aria-label="Remove MSFT"]').trigger('click');
    await wrapper.get('button[type="submit"]').trigger('submit');
    await flushPromises();
    expect(wrapper.text()).toContain('The admin token no longer works');
    expect(editable(wrapper)).toBe(false);
    expect(items(wrapper, 'stock')).toEqual(['AAPL']);
  });

  it('rejects malformed and duplicate symbols before saving', async () => {
    stubApi();
    const wrapper = await mountSettings();
    await unlock(wrapper);
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
