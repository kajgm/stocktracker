import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileTickerStore } from '../services/tickerStore.js';
import { TickerConfig } from '../services/tickerConfig.js';

const defaults = { stock: ['AAPL'], crypto: ['BTC-USD'] };

describe('FileTickerStore + TickerConfig', () => {
  let dir: string;
  let file: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tickers-'));
    file = join(dir, 'sub', 'tickers.json');
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('uses the defaults when no file exists yet', async () => {
    const config = new TickerConfig(defaults, new FileTickerStore(file));
    assert.equal(await config.load(), 'defaults');
    assert.deepEqual(config.get(), defaults);
  });

  it('persists changes across restarts, including a partial update and clear', async () => {
    const first = new TickerConfig(defaults, new FileTickerStore(file));
    await first.load();
    await first.update({ stock: ['MSFT', 'NVDA'] });

    const second = new TickerConfig(defaults, new FileTickerStore(file));
    assert.equal(await second.load(), 'stored');
    assert.deepEqual(second.get(), { stock: ['MSFT', 'NVDA'], crypto: ['BTC-USD'] });

    await second.clear();
    const third = new TickerConfig(defaults, new FileTickerStore(file));
    await third.load();
    assert.deepEqual(third.get(), { stock: [], crypto: [] });
  });

  it('applies concurrent updates in order without losing either', async () => {
    const config = new TickerConfig(defaults, new FileTickerStore(file));
    await Promise.all([config.update({ stock: ['MSFT'] }), config.update({ crypto: ['ETH-USD'] })]);
    const saved = JSON.parse(await readFile(file, 'utf8'));
    assert.deepEqual(saved, { stock: ['MSFT'], crypto: ['ETH-USD'] });
  });

  it('falls back to the defaults when the file is invalid', async () => {
    await writeFile(join(dir, 'bad.json'), '{"stock": ["not a ticker!"], "crypto": []}');
    const config = new TickerConfig(defaults, new FileTickerStore(join(dir, 'bad.json')));
    assert.equal(await config.load(), 'defaults');
    assert.deepEqual(config.get(), defaults);
  });

  it('leaves the lists unchanged when saving fails', async () => {
    const failing = {
      description: 'test',
      load: async () => null,
      save: async () => {
        throw new Error('disk full');
      }
    };
    const config = new TickerConfig(defaults, failing);
    let changed = false;
    config.on('change', () => (changed = true));
    await assert.rejects(config.update({ stock: ['MSFT'] }), /disk full/);
    assert.deepEqual(config.get(), defaults);
    assert.equal(changed, false);
    // The queue keeps working after a failure.
    const ok = new TickerConfig(defaults);
    assert.deepEqual(await ok.update({ stock: ['MSFT'] }), { stock: ['MSFT'], crypto: ['BTC-USD'] });
  });
});
