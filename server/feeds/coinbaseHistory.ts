import type { HistoryPoint } from '../../common/types/types.js';

/** Coinbase allows at most 300 candles per request: 300 x 5 min = 25 h. */
const GRANULARITY_S = 300;

/** A candle row: [time (s, bucket start), low, high, open, close, volume]. */
type Candle = [number, number, number, number, number, number];

/**
 * The last ~24 h of 5-minute closes for a Coinbase product, from the public
 * REST API (no key). Used to backfill the chart after a restart; the live
 * feed fills in minute-level detail from then on.
 * https://docs.cdp.coinbase.com/exchange/reference/exchangerestapi_getproductcandles
 */
export async function fetchCoinbaseHistory(
  product: string,
  baseUrl = 'https://api.exchange.coinbase.com'
): Promise<HistoryPoint[]> {
  const url = new URL(`${baseUrl}/products/${encodeURIComponent(product)}/candles`);
  url.searchParams.set('granularity', String(GRANULARITY_S));
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'stocktracker' },
    signal: AbortSignal.timeout(10_000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return toHistoryPoints((await res.json()) as unknown);
}

/** Candle rows -> [close time ms, close], oldest first. */
export function toHistoryPoints(body: unknown): HistoryPoint[] {
  if (!Array.isArray(body)) return [];
  return (body as Candle[])
    .filter((c) => Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[4]))
    .map((c): HistoryPoint => [(c[0] + GRANULARITY_S) * 1000, c[4]])
    .sort((a, b) => a[0] - b[0]);
}
