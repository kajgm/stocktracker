/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { type MockInstance, beforeAll, describe, expect, it, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { type TickerData, type StatusType } from '@/types/types.js';
import { useTickerStore } from '@/store/ticker.js';
import { concatNumber, priceDirection } from '@/helpers/helpers.js';
import * as websocket from '@/socket/socket.js';
import router from '@/router';
import App from '@/App.vue';

describe('App', () => {
  let websocketspy: MockInstance<[], void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tickerStore: any;

  beforeAll(() => {
    setActivePinia(createPinia());
    tickerStore = useTickerStore();
  });

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('FMP_KEY', '<your_api_key>');
  });

  it('renders the main page with stock and crypto tickers', async () => {
    vi.stubEnv('CRYPTO_TICKERS', 'TEST-CAD');
    vi.stubEnv('STOCK_TICKERS', 'KGM');

    const cryptoTicker = {
      id: 'TEST-CAD',
      curPrice: 1234,
      volume: 123456789,
      dayPercentage: 1.23,
      prevPrice: 0,
      dirFilter: priceDirection('fill-emerald-500 -rotate-90', 1234, 9999),
      status: 'CONNECTED'
    } as TickerData;

    const stockTicker = {
      id: 'KGM',
      curPrice: 987,
      volume: 987654,
      dayPercentage: 4.2,
      prevPrice: 999,
      dirFilter: priceDirection('fill-red-500 rotate-90', 987654, 0),
      status: 'CONNECTED'
    } as TickerData;

    tickerStore.setSocketStatus('CONNECTING' as StatusType);
    websocketspy = vi.spyOn(websocket, 'websocketConnect').mockImplementation(() => {
      tickerStore.setSocketStatus('CONNECTED' as StatusType);
      tickerStore.updateTickerData(cryptoTicker.id, cryptoTicker);
      tickerStore.updateTickerData(stockTicker.id, stockTicker);
    });

    void router.push('/');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    });
    expect(wrapper.text()).toEqual('Connecting...');
    expect(websocketspy).toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(tickerStore.overallStatus).toEqual('CONNECTED' as StatusType);
      expect(wrapper.text()).toContain(stockTicker.id);
      expect(wrapper.text()).toContain(cryptoTicker.id);
      expect(wrapper.text()).toContain(concatNumber(stockTicker.curPrice, 2, true, false));
      expect(wrapper.text()).toContain(concatNumber(cryptoTicker.curPrice, 2, true, false));
    });
  });

  it('renders only crypto tickers', async () => {
    vi.stubEnv('CRYPTO_TICKERS', 'TEST-CAD');
    vi.stubEnv('STOCK_TICKERS', '');

    const cryptoTicker = {
      id: 'TEST-CAD',
      curPrice: 1234,
      volume: 123456789,
      dayPercentage: 1.23,
      prevPrice: 0,
      dirFilter: priceDirection('fill-emerald-500 -rotate-90', 1234, 9999),
      status: 'CONNECTED'
    } as TickerData;

    tickerStore.setSocketStatus('CONNECTING' as StatusType);
    websocketspy = vi.spyOn(websocket, 'websocketConnect').mockImplementation(() => {
      tickerStore.setSocketStatus('CONNECTED' as StatusType);
      tickerStore.updateTickerData(cryptoTicker.id, cryptoTicker);
    });

    void router.push('/');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    });
    expect(wrapper.text()).toEqual('Connecting...');
    expect(websocketspy).toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(tickerStore.overallStatus).toEqual('CONNECTED' as StatusType);
      expect(wrapper.text()).toContain(cryptoTicker.id);
      expect(wrapper.text()).toContain(concatNumber(cryptoTicker.curPrice, 2, true, false));
    });
  });
});
