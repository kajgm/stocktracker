import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useTickerStore } from '@/store/ticker';
import { defaultTicker } from '@/types/types';

describe('ticker store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('adds placeholders for configured tickers without sharing objects', () => {
    const store = useTickerStore();
    store.setTickers({ stock: ['AAPL', 'MSFT'], crypto: ['BTC-USD'] });

    expect(store.stockKeys).toEqual(['AAPL', 'MSFT']);
    expect(store.cryptoKeys).toEqual(['BTC-USD']);
    expect(store.stockValue('AAPL')).not.toBe(store.stockValue('MSFT'));
    expect(store.cryptoValue('BTC-USD').type).toBe('CRYPTO');
    expect(defaultTicker().type).toBe('STOCK'); // the factory was not mutated
  });

  it('drops removed tickers and keeps data for remaining ones', () => {
    const store = useTickerStore();
    store.setTickers({ stock: ['AAPL', 'MSFT'], crypto: [] });
    store.applyQuote({ symbol: 'AAPL', type: 'STOCK', price: 100, changePercent: 1, timestamp: 0 });

    store.setTickers({ stock: ['AAPL'], crypto: [] });

    expect(store.stockKeys).toEqual(['AAPL']);
    expect(store.stockValue('AAPL').curPrice).toBe(100);
  });

  it('applies quotes with their times', () => {
    const store = useTickerStore();
    store.setTickers({ stock: [], crypto: ['BTC-USD'] });

    store.applyQuote({ symbol: 'BTC-USD', type: 'CRYPTO', price: 90, changePercent: -8, volume: 6, timestamp: 1234 });
    const quote = store.cryptoValue('BTC-USD');
    expect(quote).toMatchObject({ curPrice: 90, dayPercentage: -8, volume: 6, status: 'CONNECTED', quoteTime: 1234 });
    expect(quote.receivedAt).toBeGreaterThan(0);
  });

  it('ignores quotes for tickers that are not configured', () => {
    const store = useTickerStore();
    store.setTickers({ stock: ['AAPL'], crypto: [] });
    store.applyQuote({ symbol: 'TSLA', type: 'STOCK', price: 1, changePercent: 0, timestamp: 0 });
    expect(store.stockKeys).toEqual(['AAPL']);
  });

  it('marks a ticker as errored', () => {
    const store = useTickerStore();
    store.setTickers({ stock: ['NOPE'], crypto: [] });
    store.applyError({ symbol: 'NOPE', type: 'STOCK', message: 'Unknown symbol' });
    expect(store.stockValue('NOPE')).toMatchObject({ status: 'ERROR', error: 'Unknown symbol' });

    // A later quote clears the error.
    store.applyQuote({ symbol: 'NOPE', type: 'STOCK', price: 1, changePercent: 0, timestamp: 0 });
    expect(store.stockValue('NOPE').error).toBeUndefined();
  });
});
