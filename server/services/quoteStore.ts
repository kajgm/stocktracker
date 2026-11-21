import { EventEmitter } from 'node:events';
import type { TickerError, TickerQuote, TickerType } from '../../common/types/types.js';

const key = (type: TickerType, symbol: string) => `${type}:${symbol}`;

interface QuoteStoreEvents {
  quote: [TickerQuote];
  error: [TickerError];
}

/**
 * Latest quote (or error) per ticker, held in memory. Feeds write here; the
 * socket layer forwards `quote`/`error` events and replays the snapshot to
 * clients that connect later. Nothing here needs persisting: the feeds refill
 * it within one poll cycle.
 */
export class QuoteStore extends EventEmitter<QuoteStoreEvents> {
  private readonly quotes = new Map<string, TickerQuote>();
  private readonly errors = new Map<string, TickerError>();

  set(quote: TickerQuote): void {
    const k = key(quote.type, quote.symbol);
    this.errors.delete(k);
    this.quotes.set(k, quote);
    this.emit('quote', quote);
  }

  fail(error: TickerError): void {
    const k = key(error.type, error.symbol);
    this.quotes.delete(k);
    this.errors.set(k, error);
    this.emit('error', error);
  }

  snapshot(): { quotes: TickerQuote[]; errors: TickerError[] } {
    return { quotes: Array.from(this.quotes.values()), errors: Array.from(this.errors.values()) };
  }

  /** Forget tickers of `type` that are no longer configured. */
  retain(type: TickerType, symbols: string[]): void {
    for (const map of [this.quotes, this.errors]) {
      for (const [k, entry] of map) {
        if (entry.type === type && !symbols.includes(entry.symbol)) map.delete(k);
      }
    }
  }
}
