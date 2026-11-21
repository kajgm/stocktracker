import type { TickerQuote } from '../../common/types/types.js';
import { isUsMarketOpen } from '../lib/marketHours.js';
import type { QuoteStore } from '../services/quoteStore.js';

/** Response of GET /quote: https://finnhub.io/docs/api/quote */
export interface FinnhubQuote {
  c: number; // current price
  d: number | null; // change
  dp: number | null; // percent change
  h: number; // day high
  l: number; // day low
  o: number; // day open
  pc: number; // previous close
  t: number; // unix seconds
}

// Free plan: 60 calls/minute. Leave headroom for retries and restarts.
const MIN_MS_PER_CALL = 1_100;

/** Map a Finnhub quote to a TickerQuote, or null for an unknown symbol (all zeros). */
export function toTickerQuote(symbol: string, q: FinnhubQuote): TickerQuote | null {
  if (!q || !q.t || !q.c) return null;
  const changePercent = q.dp ?? (q.pc ? ((q.c - q.pc) / q.pc) * 100 : 0);
  return { symbol, type: 'STOCK', price: q.c, changePercent, timestamp: q.t * 1000 };
}

/**
 * Polls Finnhub's /quote for each stock ticker while the US market is open,
 * spacing calls to stay inside the free plan's rate limit. Every ticker is
 * also fetched once at start and whenever the list changes, so the display
 * shows the last close outside market hours.
 */
export class FinnhubPoller {
  private tickers: string[] = [];
  private timer: NodeJS.Timeout | undefined;
  private running = false;
  private generation = 0;

  constructor(
    private readonly store: QuoteStore,
    private readonly opts: { apiKey: string | undefined; baseUrl: string; intervalMs: number }
  ) {}

  start(tickers: string[]): void {
    this.running = true;
    this.setTickers(tickers);
  }

  stop(): void {
    this.running = false;
    clearTimeout(this.timer);
  }

  setTickers(tickers: string[]): void {
    this.tickers = [...tickers];
    this.generation++;
    clearTimeout(this.timer);
    if (!this.running) return;
    if (!this.opts.apiKey) {
      if (tickers.length) console.warn('FINNHUB_API_KEY is not set; stock tickers will not update');
      return;
    }
    void this.cycle(this.generation, true);
  }

  /** Effective cycle length: never faster than the rate limit allows. */
  private cycleMs(): number {
    return Math.max(this.opts.intervalMs, this.tickers.length * MIN_MS_PER_CALL);
  }

  private async cycle(generation: number, force: boolean): Promise<void> {
    if (force || isUsMarketOpen()) {
      for (const symbol of this.tickers) {
        if (generation !== this.generation || !this.running) return; // list changed mid-cycle
        await this.fetchQuote(symbol);
        await sleep(MIN_MS_PER_CALL);
      }
    }
    if (generation === this.generation && this.running) {
      this.timer = setTimeout(() => void this.cycle(generation, false), this.cycleMs());
    }
  }

  private async fetchQuote(symbol: string): Promise<void> {
    const url = new URL(`${this.opts.baseUrl}/quote`);
    url.searchParams.set('symbol', symbol);
    try {
      const res = await fetch(url, {
        headers: { 'X-Finnhub-Token': this.opts.apiKey ?? '' },
        signal: AbortSignal.timeout(10_000)
      });
      if (res.status === 429) {
        console.warn('Finnhub rate limit hit; backing off for this cycle');
        await sleep(30_000);
        return;
      }
      if (!res.ok) {
        // 401/403 = bad key or a symbol outside the plan (e.g. non-US exchanges on free).
        console.error(`Finnhub ${symbol}: HTTP ${res.status}`);
        this.store.fail({ symbol, type: 'STOCK', message: `HTTP ${res.status}` });
        return;
      }
      const quote = toTickerQuote(symbol, (await res.json()) as FinnhubQuote);
      if (quote) {
        this.store.set(quote);
      } else {
        console.error(`Finnhub ${symbol}: no data (unknown symbol?)`);
        this.store.fail({ symbol, type: 'STOCK', message: 'Unknown symbol' });
      }
    } catch (e) {
      // Network blips: keep the last good quote and try again next cycle.
      console.error(`Finnhub ${symbol}: ${(e as Error).message}`);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
