import type { TickerType } from '@/types/types';

// Same rules as server/lib/tickers.ts, so mistakes show up before saving.
const PATTERNS: Record<TickerType, RegExp> = {
  STOCK: /^[A-Z0-9][A-Z0-9.-]{0,14}$/,
  CRYPTO: /^[A-Z0-9]{1,10}-[A-Z0-9]{1,10}$/
};

const EXAMPLES: Record<TickerType, string> = { STOCK: 'AAPL', CRYPTO: 'BTC-USD' };

/**
 * Normalise a typed symbol and check it, returning either the symbol to add
 * or a message saying what's wrong.
 */
export function checkTicker(
  input: string,
  type: TickerType,
  existing: string[]
): { symbol: string } | { error: string } {
  const symbol = input.trim().toUpperCase();
  if (!symbol) return { error: 'Enter a symbol' };
  if (!PATTERNS[type].test(symbol)) {
    return {
      error:
        type == 'CRYPTO'
          ? `Use a Coinbase product like ${EXAMPLES.CRYPTO}`
          : `Use a US stock symbol like ${EXAMPLES.STOCK}`
    };
  }
  if (existing.includes(symbol)) return { error: `${symbol} is already in the list` };
  return { symbol };
}
