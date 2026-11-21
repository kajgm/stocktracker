import { EventEmitter } from 'node:events';
import type { TickerLists } from '../../common/types/types.js';
import type { TickerStore } from './tickerStore.js';

interface TickerConfigEvents {
  change: [TickerLists];
}

/**
 * The configured ticker lists. Seeded from STOCK_TICKERS/CRYPTO_TICKERS; once
 * lists are changed through the API they are saved to the store (when there is
 * one) and take precedence over the defaults on later starts.
 */
export class TickerConfig extends EventEmitter<TickerConfigEvents> {
  private lists: TickerLists;
  /** Serializes changes so concurrent API calls can't overwrite each other. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    defaults: TickerLists,
    private readonly store?: TickerStore
  ) {
    super();
    this.lists = { stock: [...defaults.stock], crypto: [...defaults.crypto] };
  }

  /**
   * Load the stored lists, if any, replacing the defaults. An unreadable store
   * is logged and the defaults are used, so the display still comes up; the
   * next change through the API overwrites it.
   */
  async load(): Promise<'stored' | 'defaults'> {
    if (!this.store) return 'defaults';
    try {
      const stored = await this.store.load();
      if (!stored) return 'defaults';
      this.lists = stored;
      return 'stored';
    } catch (e) {
      console.error(`Could not load tickers from ${this.store.description}: ${(e as Error).message}`);
      return 'defaults';
    }
  }

  get(): TickerLists {
    return { stock: [...this.lists.stock], crypto: [...this.lists.crypto] };
  }

  /** Replace the lists given; an omitted list is left unchanged. */
  update(change: Partial<TickerLists>): Promise<TickerLists> {
    return this.enqueue(() => ({
      stock: change.stock ?? this.lists.stock,
      crypto: change.crypto ?? this.lists.crypto
    }));
  }

  /** Empty both lists. Saved like any other change, so it survives a restart. */
  clear(): Promise<TickerLists> {
    return this.enqueue(() => ({ stock: [], crypto: [] }));
  }

  private enqueue(next: () => TickerLists): Promise<TickerLists> {
    const run = this.queue.then(async () => {
      const lists = next();
      // Save first: if the write fails the API returns an error and nothing changes.
      await this.store?.save(lists);
      this.lists = lists;
      this.emit('change', this.get());
      return this.get();
    });
    this.queue = run.catch(() => undefined);
    return run;
  }
}
