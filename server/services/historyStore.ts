import type { HistoryPoint, HistoryRange, TickerQuote, TickerType } from '../../common/types/types.js';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** One point per minute: the last price seen in that minute. */
export const BUCKET_MS = MINUTE;
/** Long enough to still show Friday's session after a long weekend. */
export const RETAIN_MS = 5 * DAY;

export const RANGES: Record<HistoryRange, number> = { '1h': HOUR, '6h': 6 * HOUR, '1d': DAY, '5d': 5 * DAY };

const key = (type: TickerType, symbol: string) => `${type}:${symbol}`;

/**
 * Recent price history per ticker, built from the live quotes (and a Coinbase
 * backfill for crypto), in one-minute buckets. Small enough to keep in memory:
 * at most RETAIN_MS / BUCKET_MS = 7,200 points per ticker.
 */
export class HistoryStore {
  private readonly series = new Map<string, HistoryPoint[]>();

  record(quote: TickerQuote, now = Date.now()): void {
    const k = key(quote.type, quote.symbol);
    const bucket = Math.floor(quote.timestamp / BUCKET_MS) * BUCKET_MS;
    let points = this.series.get(k);
    if (!points) this.series.set(k, (points = []));
    const last = points.at(-1);
    if (last && last[0] === bucket) {
      last[1] = quote.price;
    } else if (!last || bucket > last[0]) {
      points.push([bucket, quote.price]);
      this.prune(points, now);
    }
    // Older than the latest bucket: a late or repeated quote, ignore it.
  }

  /** Add older points (e.g. a backfill) in front of what was recorded live. */
  seed(type: TickerType, symbol: string, older: HistoryPoint[], now = Date.now()): void {
    const k = key(type, symbol);
    const points = this.series.get(k) ?? [];
    const firstLive = points[0]?.[0] ?? Infinity;
    const before = older
      .map(([t, p]): HistoryPoint => [Math.floor(t / BUCKET_MS) * BUCKET_MS, p])
      // Not after now: a still-open candle would block live points until it ends.
      .filter(([t]) => t < firstLive && t <= now)
      .sort((a, b) => a[0] - b[0])
      .filter((point, i, all) => i === 0 || point[0] !== all[i - 1][0]);
    const merged = [...before, ...points];
    this.prune(merged, now);
    this.series.set(k, merged);
  }

  /**
   * Points in `range`, ending at the latest point rather than now, so a
   * closed market still shows its last session. Downsampled to at most
   * `maxPoints` by keeping the last point of each slice.
   */
  get(type: TickerType, symbol: string, range: HistoryRange, maxPoints = 300): HistoryPoint[] {
    const points = this.series.get(key(type, symbol)) ?? [];
    const end = points.at(-1)?.[0];
    if (end === undefined) return [];
    const inRange = points.filter(([t]) => t >= end - RANGES[range]);
    if (inRange.length <= maxPoints) return inRange.map(([t, p]): HistoryPoint => [t, p]);
    const step = inRange.length / maxPoints;
    const sampled: HistoryPoint[] = [];
    for (let i = 1; i <= maxPoints; i++) {
      const [t, p] = inRange[Math.ceil(i * step) - 1];
      sampled.push([t, p]);
    }
    return sampled;
  }

  has(type: TickerType, symbol: string): boolean {
    return (this.series.get(key(type, symbol))?.length ?? 0) > 0;
  }

  /** Drop history for tickers no longer configured. */
  retain(type: TickerType, symbols: string[]): void {
    const keep = new Set(symbols.map((s) => key(type, s)));
    for (const k of this.series.keys()) {
      if (k.startsWith(`${type}:`) && !keep.has(k)) this.series.delete(k);
    }
  }

  toJSON(): Record<string, HistoryPoint[]> {
    return Object.fromEntries(this.series);
  }

  /** Restore from toJSON() output, skipping anything malformed or expired. */
  load(data: unknown, now = Date.now()): void {
    if (!data || typeof data !== 'object') return;
    for (const [k, value] of Object.entries(data as Record<string, unknown>)) {
      if (!/^(STOCK|CRYPTO):/.test(k) || !Array.isArray(value)) continue;
      const points = value.filter(
        (p): p is HistoryPoint => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1])
      );
      points.sort((a, b) => a[0] - b[0]);
      this.prune(points, now);
      if (points.length) this.series.set(k, points);
    }
  }

  private prune(points: HistoryPoint[], now: number): void {
    const cutoff = now - RETAIN_MS;
    let drop = 0;
    while (drop < points.length && points[drop][0] < cutoff) drop++;
    if (drop) points.splice(0, drop);
  }
}
