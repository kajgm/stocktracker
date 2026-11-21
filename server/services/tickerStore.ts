import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { TickerLists } from '../../common/types/types.js';
import { parseTickerList } from '../lib/tickers.js';
import { ConfigDB } from '../models/Config.js';

/** Where ticker lists set through the API are kept between restarts. */
export interface TickerStore {
  /** Human-readable location, for logs. */
  readonly description: string;
  /** The stored lists, or null when nothing has been stored yet. */
  load(): Promise<TickerLists | null>;
  save(lists: TickerLists): Promise<void>;
}

/** Validate stored lists the same way as API input, so a hand-edited file can't inject bad symbols. */
function toLists(value: unknown): TickerLists {
  const v = value as Partial<Record<keyof TickerLists, unknown>> | null;
  if (!v || !Array.isArray(v.stock) || !Array.isArray(v.crypto)) {
    throw new Error('expected {"stock": [...], "crypto": [...]}');
  }
  return {
    stock: parseTickerList(v.stock as string[], 'STOCK'),
    crypto: parseTickerList(v.crypto as string[], 'CRYPTO')
  };
}

/**
 * JSON file, e.g. on a small volume. Writes go to a temp file that is renamed
 * over the old one, so a crash mid-write never leaves a half-written file.
 */
export class FileTickerStore implements TickerStore {
  readonly description: string;

  constructor(private readonly path: string) {
    this.description = `file ${path}`;
  }

  async load(): Promise<TickerLists | null> {
    let text: string;
    try {
      text = await readFile(this.path, 'utf8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw e;
    }
    try {
      return toLists(JSON.parse(text));
    } catch (e) {
      throw new Error(`not a valid ticker file: ${(e as Error).message}`, { cause: e });
    }
  }

  async save(lists: TickerLists): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.tmp`;
    await writeFile(tmp, `${JSON.stringify(lists, null, 2)}\n`, 'utf8');
    await rename(tmp, this.path);
  }
}

/** One document per `user` in the `configs` collection (the original schema). */
export class MongoTickerStore implements TickerStore {
  readonly description = 'MongoDB';

  constructor(private readonly user: string) {}

  async load(): Promise<TickerLists | null> {
    const stored = await ConfigDB.findOne({ user: this.user }).lean();
    return stored ? toLists({ stock: stored.stockTickers, crypto: stored.cryptoTickers }) : null;
  }

  async save(lists: TickerLists): Promise<void> {
    await ConfigDB.findOneAndUpdate(
      { user: this.user },
      { stockTickers: lists.stock, cryptoTickers: lists.crypto },
      { upsert: true }
    );
  }
}
