import type { TickerType } from '../../common/types/types.js';

// Stocks: AAPL, BRK.B, RDS-A. Crypto (Coinbase product ids): BTC-USD, ETH-USDC.
const STOCK_RE = /^[A-Z0-9][A-Z0-9.-]{0,14}$/;
const CRYPTO_RE = /^[A-Z0-9]{1,10}-[A-Z0-9]{1,10}$/;

export class InvalidTickerError extends Error {}

/**
 * Parse a comma-separated list (or array) of tickers: trims, uppercases,
 * drops empties and duplicates. Throws InvalidTickerError on a malformed symbol
 * so bad input never reaches a provider URL.
 */
export function parseTickerList(input: string | string[], type: TickerType): string[] {
  const parts = Array.isArray(input) ? input : input.split(',');
  const pattern = type === 'STOCK' ? STOCK_RE : CRYPTO_RE;
  const result: string[] = [];
  for (const part of parts) {
    const symbol = String(part).trim().toUpperCase();
    if (!symbol) continue;
    if (!pattern.test(symbol)) {
      throw new InvalidTickerError(`Invalid ${type.toLowerCase()} ticker "${symbol}"`);
    }
    if (!result.includes(symbol)) result.push(symbol);
  }
  return result;
}
