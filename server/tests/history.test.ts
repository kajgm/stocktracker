import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { HistoryStore, RETAIN_MS } from '../services/historyStore.js';
import { toHistoryPoints } from '../feeds/coinbaseHistory.js';
import { historyRouter } from '../routes/history.js';
import { TickerConfig } from '../services/tickerConfig.js';
import type { TickerQuote } from '../../common/types/types.js';

const T0 = Date.parse('2026-11-20T15:00:00Z');
const MIN = 60_000;
const quote = (price: number, timestamp: number, symbol = 'BTC-USD'): TickerQuote => ({
  symbol,
  type: 'CRYPTO',
  price,
  changePercent: 0,
  timestamp
});

describe('HistoryStore', () => {
  it('keeps the last price per minute and ignores late quotes', () => {
    const h = new HistoryStore();
    h.record(quote(1, T0 + 5_000), T0);
    h.record(quote(2, T0 + 40_000), T0); // same minute: replaces
    h.record(quote(3, T0 + MIN + 1), T0);
    h.record(quote(9, T0 + 10_000), T0); // older than the latest minute: ignored
    assert.deepEqual(h.get('CRYPTO', 'BTC-USD', '1h'), [
      [T0, 2],
      [T0 + MIN, 3]
    ]);
  });

  it('anchors ranges at the latest point, so a closed market still shows its session', () => {
    const h = new HistoryStore();
    const fridayOpen = Date.parse('2026-11-20T14:30:00Z');
    for (let m = 0; m <= 390; m++)
      h.record({ ...quote(100 + m, fridayOpen + m * MIN, 'AAPL'), type: 'STOCK' }, fridayOpen);
    const saturday = Date.parse('2026-11-21T15:00:00Z');
    h.record({ ...quote(500, saturday, 'MSFT'), type: 'STOCK' }, saturday); // unrelated ticker, later time
    const lastHour = h.get('STOCK', 'AAPL', '1h');
    assert.equal(lastHour.length, 61);
    assert.equal(lastHour.at(-1)![1], 490);
  });

  it('downsamples to the requested number of points, keeping the latest', () => {
    const h = new HistoryStore();
    for (let m = 0; m < 1000; m++) h.record(quote(m, T0 + m * MIN), T0);
    const points = h.get('CRYPTO', 'BTC-USD', '1d', 100);
    assert.equal(points.length, 100);
    assert.equal(points.at(-1)![1], 999);
  });

  it('seeds older points in front of live ones, never after now', () => {
    const h = new HistoryStore();
    h.record(quote(50, T0 + 10 * MIN), T0 + 10 * MIN);
    h.seed(
      'CRYPTO',
      'BTC-USD',
      [
        [T0, 10],
        [T0 + 5 * MIN, 20],
        [T0 + 15 * MIN, 99] // after the live point (and after now): dropped
      ],
      T0 + 10 * MIN
    );
    assert.deepEqual(h.get('CRYPTO', 'BTC-USD', '1h'), [
      [T0, 10],
      [T0 + 5 * MIN, 20],
      [T0 + 10 * MIN, 50]
    ]);
  });

  it('drops points older than the retention window and removed tickers', () => {
    const h = new HistoryStore();
    h.record(quote(1, T0), T0);
    h.record(quote(2, T0 + RETAIN_MS + MIN), T0 + RETAIN_MS + MIN);
    assert.equal(h.get('CRYPTO', 'BTC-USD', '5d').length, 1);
    h.retain('CRYPTO', []);
    assert.equal(h.has('CRYPTO', 'BTC-USD'), false);
  });

  it('round-trips through JSON, skipping malformed data', () => {
    const h = new HistoryStore();
    h.record(quote(1, T0), T0);
    const copy = new HistoryStore();
    copy.load({ ...JSON.parse(JSON.stringify(h)), 'BAD:X': [[1, 2]], 'CRYPTO:ETH-USD': [['x', 1]] }, T0);
    assert.deepEqual(copy.get('CRYPTO', 'BTC-USD', '1h'), [[T0, 1]]);
    assert.equal(copy.has('CRYPTO', 'ETH-USD'), false);
  });
});

describe('Coinbase candles', () => {
  it('maps rows to close-time points, oldest first', () => {
    const rows = [
      [1_700_000_300, 1, 3, 2, 2.5, 10],
      [1_700_000_000, 1, 3, 2, 2.2, 10]
    ];
    assert.deepEqual(toHistoryPoints(rows), [
      [1_700_000_300_000, 2.2],
      [1_700_000_600_000, 2.5]
    ]);
    assert.deepEqual(toHistoryPoints({ message: 'NotFound' }), []);
  });
});

describe('GET /api/history', () => {
  it('serves configured tickers only and validates input', async () => {
    const h = new HistoryStore();
    h.record(quote(1, T0), T0);
    h.record(quote(2, T0 + MIN), T0);
    const tickers = new TickerConfig({ stock: ['AAPL'], crypto: ['BTC-USD'] });
    const app = express().use('/api/history', historyRouter(h, tickers));
    const server = app.listen(0);
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/history`;
    try {
      const ok = await fetch(`${base}/crypto/btc-usd?range=1h`);
      assert.equal(ok.status, 200);
      assert.deepEqual(await ok.json(), {
        symbol: 'BTC-USD',
        type: 'CRYPTO',
        range: '1h',
        points: [
          [T0, 1],
          [T0 + MIN, 2]
        ]
      });
      assert.equal((await fetch(`${base}/crypto/ETH-USD`)).status, 404);
      assert.equal((await fetch(`${base}/bond/X`)).status, 400);
      assert.equal((await fetch(`${base}/crypto/BTC-USD?range=2y`)).status, 400);
      assert.equal((await fetch(`${base}/crypto/BTC-USD?points=1`)).status, 400);
    } finally {
      server.close();
    }
  });
});

describe('history file', () => {
  it('saves and loads history', async () => {
    const { mkdtemp, rm } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { loadHistoryFile, saveHistoryFile } = await import('../services/historyFile.js');
    const dir = await mkdtemp(join(tmpdir(), 'history-'));
    try {
      const file = join(dir, 'data', 'history.json');
      const h = new HistoryStore();
      h.record(quote(1, Date.now()));
      await saveHistoryFile(h, file);
      const copy = new HistoryStore();
      await loadHistoryFile(copy, file);
      assert.equal(copy.has('CRYPTO', 'BTC-USD'), true);
      await loadHistoryFile(new HistoryStore(), join(dir, 'missing.json')); // no throw
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
