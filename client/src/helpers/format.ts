import { concatNumber } from './helpers';

const twoDecimals = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const smallPrice = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 4 });

/** "$60,187.66"; sub-dollar prices keep 4 significant digits ("$0.1234"). */
export function formatPrice(price: number): string {
  return `$${price >= 1 ? twoDecimals.format(price) : smallPrice.format(price)}`;
}

/** Always signed with two decimals, so the width stays steady: "+0.80%", "-2.45%". */
export function formatPercent(percent: number): string {
  const rounded = Math.round(percent * 100) / 100;
  return `${rounded >= 0 ? '+' : '-'}${Math.abs(rounded).toFixed(2)}%`;
}

/** Crypto 24h volume in the base currency: "31.8k BTC" for BTC-USD. */
export function formatVolume(volume: number, symbol: string): string {
  return `${concatNumber(volume, 1, false, true)} ${symbol.split('-')[0]}`;
}

/** A short hint for a ticker error, or '' when there's nothing more useful to say. */
export function errorHint(message: string): string {
  if (message === 'Unknown symbol') return 'Check the ticker list';
  if (message === 'FINNHUB_API_KEY not set') return 'Set it on the server';
  if (/HTTP 40[13]/.test(message)) return 'Check the Finnhub key or plan';
  if (message === 'HTTP 429') return 'Rate limited, retrying';
  return '';
}
