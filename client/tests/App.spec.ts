/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { type MockInstance, describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import type { TickerType } from '@/types/types';
import { type TickerData, type StatusType } from '@/types/types';
import { useTickerStore } from '@/store/ticker';
import { concatNumber, priceDirection } from '@/helpers/helpers';
import * as websocket from '@/crypto/crypto.js';
import * as api from '@/stock/stock.js';
import * as server from '@/server/server';
import router from '@/router';
import App from '@/App.vue';

describe('App', () => {
  let websocketSpy: MockInstance<[], WebSocket>;
  let apiSpy: MockInstance<[], void>;
  let serverSpyGet: MockInstance<[], boolean[]>;
  let serverSpyPoll: MockInstance<[socket: WebSocket | undefined], void>;

  const cryptoTicker = {
    id: 'TEST-CAD',
    curPrice: 1234,
    volume: 123456789,
    dayPercentage: 1.23,
    prevPrice: 0,
    dirFilter: priceDirection('fill-emerald-500 -rotate-90', 1234, 9999),
    type: 'CRYPTO',
    status: 'CONNECTED'
  } as TickerData;

  const stockTicker = {
    id: 'KGM',
    curPrice: 987,
    volume: 987654,
    dayPercentage: 4.2,
    prevPrice: 999,
    dirFilter: priceDirection('fill-red-500 rotate-90', 0, 0),
    type: 'STOCK',
    status: 'CONNECTED'
  } as TickerData;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubEnv('FMP_KEY', '<your_api_key>');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('renders the main page with stock and crypto tickers', async () => {
    vi.stubEnv('CRYPTO_TICKERS', 'TEST-CAD');
    vi.stubEnv('STOCK_TICKERS', 'KGM');
    vi.stubEnv('FMP_KEY', 'test');
    const tickerStore = useTickerStore();

    tickerStore.setSocketStatus('CONNECTING' as StatusType);
    tickerStore.setApiStatus('CONNECTING' as StatusType);
    websocketSpy = vi.spyOn(websocket, 'websocketConnect').mockImplementation(() => {
      tickerStore.setSocketStatus('CONNECTED' as StatusType);
      tickerStore.addNewTicker(cryptoTicker.id, 'CRYPTO' as TickerType, cryptoTicker);
      return null as unknown as WebSocket;
    });
    apiSpy = vi.spyOn(api, 'restApiPoll').mockImplementation(() => {
      tickerStore.setApiStatus('CONNECTED' as StatusType);
      tickerStore.addNewTicker(stockTicker.id, 'STOCK' as TickerType, stockTicker);
    });
    serverSpyGet = vi.spyOn(server, 'getUpdatedTickers').mockImplementation(() => {
      return [true, false];
    });
    serverSpyPoll = vi.spyOn(server, 'pollUpdatedTickers').mockImplementation(() => {});

    void router.push('/');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    });

    expect(wrapper.text()).toContain('Connecting...');
    expect(websocketSpy).toHaveBeenCalled();
    expect(apiSpy).toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(tickerStore.overallStatus).toEqual('CONNECTED' as StatusType);
      expect(tickerStore.socketStatus).toEqual('CONNECTED' as StatusType);
      expect(tickerStore.apiStatus).toEqual('CONNECTED' as StatusType);
      expect(wrapper.text()).toContain(stockTicker.id);
      expect(wrapper.text()).toContain(cryptoTicker.id);
      expect(wrapper.text()).toContain(concatNumber(stockTicker.curPrice, 2, true, false));
      expect(wrapper.text()).toContain(concatNumber(cryptoTicker.curPrice, 2, true, false));
    });
  });

  it('renders only crypto tickers', async () => {
    vi.stubEnv('CRYPTO_TICKERS', 'TEST-CAD');
    vi.stubEnv('STOCK_TICKERS', '');
    const tickerStore = useTickerStore();

    const testMap = new Map<string, TickerData>();
    testMap.set(cryptoTicker.id as string, cryptoTicker);

    tickerStore.setSocketStatus('CONNECTING' as StatusType);
    websocketSpy = vi.spyOn(websocket, 'websocketConnect').mockImplementation(() => {
      tickerStore.setSocketStatus('CONNECTED' as StatusType);
      tickerStore.addNewTicker(cryptoTicker.id, 'CRYPTO' as TickerType, cryptoTicker);
      return null as unknown as WebSocket;
    });
    serverSpyGet = vi.spyOn(server, 'getUpdatedTickers').mockImplementation(() => {
      return [true, false];
    });
    serverSpyPoll = vi.spyOn(server, 'pollUpdatedTickers').mockImplementation(() => {});

    void router.push('/');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    });

    expect(wrapper.text()).toContain('Connecting...');
    expect(websocketSpy).toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(tickerStore.overallStatus).toEqual('CONNECTED' as StatusType);
      expect(tickerStore.socketStatus).toEqual('CONNECTED' as StatusType);
      expect(tickerStore.apiStatus).toEqual('CONNECTING' as StatusType);
      expect(wrapper.text()).toContain(cryptoTicker.id);
      expect(wrapper.text()).toContain(concatNumber(cryptoTicker.curPrice, 2, true, false));
      expect(tickerStore.tickerData).toEqual(testMap);
    });
  });

  it('renders only stock tickers', async () => {
    vi.stubEnv('CRYPTO_TICKERS', '');
    vi.stubEnv('STOCK_TICKERS', 'KGM');
    vi.stubEnv('FMP_KEY', 'test');
    const tickerStore = useTickerStore();

    const testMap = new Map<string, TickerData>();
    testMap.set(stockTicker.id as string, stockTicker);

    tickerStore.setSocketStatus('CONNECTING' as StatusType);
    apiSpy = vi.spyOn(api, 'restApiPoll').mockImplementation(() => {
      tickerStore.setApiStatus('CONNECTED' as StatusType);
      tickerStore.addNewTicker(stockTicker.id, 'STOCK' as TickerType, stockTicker);
    });
    serverSpyGet = vi.spyOn(server, 'getUpdatedTickers').mockImplementation(() => {
      return [true, false];
    });
    serverSpyPoll = vi.spyOn(server, 'pollUpdatedTickers').mockImplementation(() => {});

    void router.push('/');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    });

    expect(wrapper.text()).toContain('Connecting...');
    expect(apiSpy).toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(tickerStore.overallStatus).toEqual('CONNECTED' as StatusType);
      expect(tickerStore.socketStatus).toEqual('CONNECTING' as StatusType);
      expect(tickerStore.apiStatus).toEqual('CONNECTED' as StatusType);
      expect(wrapper.text()).toContain(stockTicker.id);
      expect(wrapper.text()).toContain(concatNumber(stockTicker.curPrice, 2, true, false));
      expect(tickerStore.tickerData).toEqual(testMap);
    });
  });

  it('renders the price change', async () => {
    vi.stubEnv('CRYPTO_TICKERS', 'TEST-CAD');
    vi.stubEnv('STOCK_TICKERS', '');
    const tickerStore = useTickerStore();

    const updatedCryptoTicker = {
      id: 'TEST-CAD',
      curPrice: 0,
      volume: 123456789,
      dayPercentage: 1.23,
      prevPrice: 0,
      dirFilter: priceDirection('fill-emerald-500 -rotate-90', 9999, 1234),
      status: 'CONNECTED'
    } as TickerData;

    const connectingCryptoTicker = {
      id: 'TEST-CAD',
      curPrice: 0,
      volume: 123456789,
      dayPercentage: 1.23,
      prevPrice: 0,
      dirFilter: priceDirection('fill-emerald-500 -rotate-90', 9999, 1234),
      status: 'CONNECTING'
    } as TickerData;

    const errorCryptoTicker = {
      id: 'TEST-CAD',
      curPrice: 0,
      volume: 123456789,
      dayPercentage: 1.23,
      prevPrice: 0,
      dirFilter: priceDirection('fill-emerald-500 -rotate-90', 9999, 1234),
      status: 'ERROR'
    } as TickerData;

    tickerStore.setSocketStatus('CONNECTING' as StatusType);
    websocketSpy = vi.spyOn(websocket, 'websocketConnect').mockImplementation(() => {
      tickerStore.setSocketStatus('CONNECTED' as StatusType);
      tickerStore.addNewTicker(cryptoTicker.id, 'CRYPTO' as TickerType, cryptoTicker);
      return null as unknown as WebSocket;
    });
    serverSpyGet = vi.spyOn(server, 'getUpdatedTickers').mockImplementation(() => {
      return [true, false];
    });
    serverSpyPoll = vi.spyOn(server, 'pollUpdatedTickers').mockImplementation(() => {});

    void router.push('/');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    });

    expect(wrapper.text()).toContain('Connecting...');
    expect(websocketSpy).toHaveBeenCalled();

    await vi.waitFor(() => {
      expect(tickerStore.overallStatus).toEqual('CONNECTED' as StatusType);
      expect(tickerStore.socketStatus).toEqual('CONNECTED' as StatusType);
      expect(tickerStore.apiStatus).toEqual('CONNECTING' as StatusType);
      expect(wrapper.text()).toContain(cryptoTicker.id);
      expect(wrapper.text()).toContain(concatNumber(cryptoTicker.curPrice, 2, true, false));
    });
    await vi.waitFor(() => {
      // update the store with a new price value
      tickerStore.updateTickerData(updatedCryptoTicker.id, updatedCryptoTicker);

      // verify the change occurred
      expect(wrapper.text()).toContain(updatedCryptoTicker.id);
      expect(wrapper.text()).toContain(concatNumber(updatedCryptoTicker.curPrice, 2, true, false));
    });

    await vi.waitFor(() => {
      // update the store with a new status value
      tickerStore.updateTickerData(connectingCryptoTicker.id, connectingCryptoTicker);
      expect(wrapper.text()).toContain('Connecting...');
    });

    await vi.waitFor(() => {
      // update the store with a new status value
      tickerStore.updateTickerData(errorCryptoTicker.id, errorCryptoTicker);
      expect(wrapper.text()).toContain('Error');
    });
  });

  it('renders the graph view', async () => {
    vi.stubEnv('CRYPTO_TICKERS', 'TEST-CAD');
    vi.stubEnv('STOCK_TICKERS', 'KGM');
    const tickerStore = useTickerStore();

    tickerStore.setSocketStatus('CONNECTING' as StatusType);
    websocketSpy = vi.spyOn(websocket, 'websocketConnect').mockImplementation(() => {
      tickerStore.setSocketStatus('CONNECTED' as StatusType);
      tickerStore.setApiStatus('CONNECTED' as StatusType);
      tickerStore.addNewTicker(cryptoTicker.id, 'CRYPTO' as TickerType, cryptoTicker);
      tickerStore.addNewTicker(stockTicker.id, 'STOCK' as TickerType, stockTicker);
      return null as unknown as WebSocket;
    });
    serverSpyGet = vi.spyOn(server, 'getUpdatedTickers').mockImplementation(() => {
      return [true, false];
    });
    serverSpyPoll = vi.spyOn(server, 'pollUpdatedTickers').mockImplementation(() => {});

    void router.push('/');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    });

    expect(wrapper.text()).toContain('Connecting...');
    expect(websocketSpy).toHaveBeenCalled();

    await vi.waitFor(async () => {
      expect(tickerStore.overallStatus).toEqual('CONNECTED' as StatusType);
      expect(tickerStore.socketStatus).toEqual('CONNECTED' as StatusType);
      expect(tickerStore.apiStatus).toEqual('CONNECTED' as StatusType);
      await wrapper.get('#TEST-CAD').trigger('click');
      expect(wrapper.text()).toContain('TEST-CAD');
      expect(wrapper.text()).not.toContain('KGM');
    });
  });
});
