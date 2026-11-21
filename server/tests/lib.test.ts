import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isUsMarketOpen } from '../lib/marketHours.js';
import { InvalidTickerError, parseTickerList } from '../lib/tickers.js';
import { toTickerQuote as fromFinnhub } from '../feeds/finnhub.js';
import { toTickerQuote as fromCoinbase } from '../feeds/coinbase.js';

describe('isUsMarketOpen', () => {
  it('uses EDT in summer (UTC-4)', () => {
    assert.equal(isUsMarketOpen(new Date('2026-07-15T13:29:00Z')), false); // 09:29 EDT
    assert.equal(isUsMarketOpen(new Date('2026-07-15T13:30:00Z')), true); // 09:30 EDT
    assert.equal(isUsMarketOpen(new Date('2026-07-15T20:00:00Z')), true); // 16:00 EDT
    assert.equal(isUsMarketOpen(new Date('2026-07-15T20:01:00Z')), false);
  });

  it('uses EST in winter (UTC-5)', () => {
    // A fixed UTC-4 offset would read 10:00 here and wrongly report open.
    assert.equal(isUsMarketOpen(new Date('2026-11-20T14:00:00Z')), false); // 09:00 EST
    assert.equal(isUsMarketOpen(new Date('2026-11-20T14:30:00Z')), true); // 09:30 EST
    assert.equal(isUsMarketOpen(new Date('2026-11-20T21:00:00Z')), true); // 16:00 EST
    assert.equal(isUsMarketOpen(new Date('2026-11-20T21:01:00Z')), false);
  });

  it('is closed at weekends', () => {
    assert.equal(isUsMarketOpen(new Date('2026-11-21T16:00:00Z')), false); // Saturday
    assert.equal(isUsMarketOpen(new Date('2026-11-22T16:00:00Z')), false); // Sunday
  });
});

describe('parseTickerList', () => {
  it('normalizes, dedupes and drops empties', () => {
    assert.deepEqual(parseTickerList(' aapl, msft,,AAPL ,brk.b', 'STOCK'), ['AAPL', 'MSFT', 'BRK.B']);
    assert.deepEqual(parseTickerList(['btc-usd', 'ETH-USD'], 'CRYPTO'), ['BTC-USD', 'ETH-USD']);
    assert.deepEqual(parseTickerList('', 'STOCK'), []);
  });

  it('rejects malformed symbols', () => {
    assert.throws(() => parseTickerList('AAPL&token=x', 'STOCK'), InvalidTickerError);
    assert.throws(() => parseTickerList('BTC', 'CRYPTO'), InvalidTickerError);
  });
});

describe('Finnhub quote mapping', () => {
  it('maps a quote', () => {
    const q = fromFinnhub('AAPL', { c: 110, d: 10, dp: 10, h: 111, l: 99, o: 100, pc: 100, t: 1_700_000_000 });
    assert.deepEqual(q, { symbol: 'AAPL', type: 'STOCK', price: 110, changePercent: 10, timestamp: 1_700_000_000_000 });
  });

  it('computes percent change when dp is null', () => {
    const q = fromFinnhub('AAPL', { c: 90, d: null, dp: null, h: 0, l: 0, o: 0, pc: 100, t: 1 });
    assert.equal(q?.changePercent, -10);
  });

  it('returns null for an unknown symbol', () => {
    assert.equal(fromFinnhub('NOPE', { c: 0, d: null, dp: null, h: 0, l: 0, o: 0, pc: 0, t: 0 }), null);
  });
});

describe('Coinbase ticker mapping', () => {
  it('maps a ticker message', () => {
    const q = fromCoinbase({
      type: 'ticker',
      product_id: 'BTC-USD',
      price: '105',
      open_24h: '100',
      volume_24h: '1234.5',
      time: '2026-11-20T00:00:00.000Z'
    });
    assert.deepEqual(q, {
      symbol: 'BTC-USD',
      type: 'CRYPTO',
      price: 105,
      changePercent: 5,
      volume: 1234.5,
      timestamp: Date.parse('2026-11-20T00:00:00.000Z')
    });
  });
});
