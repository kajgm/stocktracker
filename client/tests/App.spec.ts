import { describe, expect, it, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { useTickerStore } from '@/store/ticker';
import router from '@/router';
import App from '@/App.vue';

async function mountApp() {
  void router.push('/');
  await router.isReady();
  return mount(App, { global: { plugins: [router] } });
}

describe('App', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows connecting until the server sends tickers', async () => {
    const wrapper = await mountApp();
    expect(wrapper.text()).toContain('Connecting...');
  });

  it('shows an empty state when no tickers are configured', async () => {
    const store = useTickerStore();
    store.connection = 'CONNECTED';
    store.setTickers({ stock: [], crypto: [] });
    const wrapper = await mountApp();
    expect(wrapper.text()).toContain('No tickers configured');
  });

  it('renders a ticker with its price', async () => {
    const store = useTickerStore();
    store.connection = 'CONNECTED';
    store.setTickers({ stock: ['AAPL'], crypto: [] });
    store.applyQuote({ symbol: 'AAPL', type: 'STOCK', price: 123.45, changePercent: 1.5, timestamp: 0 });
    const wrapper = await mountApp();
    expect(wrapper.text()).toContain('AAPL');
    expect(wrapper.text()).toContain('$123.45');
  });
});
