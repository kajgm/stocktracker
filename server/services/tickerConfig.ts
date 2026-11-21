import { EventEmitter } from 'node:events';
import type { TickerLists } from '../../common/types/types.js';
import { ConfigDB } from '../models/Config.js';

interface TickerConfigEvents {
  change: [TickerLists];
}

/**
 * The configured ticker lists. Persists to MongoDB when `persist` is true,
 * otherwise keeps them in memory (seeded from STOCK_TICKERS/CRYPTO_TICKERS).
 */
export class TickerConfig extends EventEmitter<TickerConfigEvents> {
  private lists: TickerLists;

  constructor(
    defaults: TickerLists,
    private readonly persist: boolean,
    private readonly user: string
  ) {
    super();
    this.lists = { stock: [...defaults.stock], crypto: [...defaults.crypto] };
  }

  /** Load the stored lists, if any, replacing the defaults. */
  async load(): Promise<void> {
    if (!this.persist) return;
    const stored = await ConfigDB.findOne({ user: this.user }).lean();
    if (stored) {
      this.lists = { stock: stored.stockTickers, crypto: stored.cryptoTickers };
    }
  }

  get(): TickerLists {
    return { stock: [...this.lists.stock], crypto: [...this.lists.crypto] };
  }

  /** Replace the lists given; an omitted list is left unchanged. */
  async update(change: Partial<TickerLists>): Promise<TickerLists> {
    const next: TickerLists = {
      stock: change.stock ?? this.lists.stock,
      crypto: change.crypto ?? this.lists.crypto
    };
    await this.save(next);
    return this.get();
  }

  async clear(): Promise<TickerLists> {
    if (this.persist) await ConfigDB.deleteMany({ user: this.user });
    this.lists = { stock: [], crypto: [] };
    this.emit('change', this.get());
    return this.get();
  }

  private async save(next: TickerLists): Promise<void> {
    if (this.persist) {
      await ConfigDB.findOneAndUpdate(
        { user: this.user },
        { stockTickers: next.stock, cryptoTickers: next.crypto },
        { upsert: true }
      );
    }
    this.lists = next;
    this.emit('change', this.get());
  }
}
