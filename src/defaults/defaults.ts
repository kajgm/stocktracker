import { type TickerData } from '@/types/types';

// Limited to 250 requests per day
// Standard trading day is open 6.5 hours
// (6.5hr * 60min * 60sec * 1000ms) / 250 requests
// Called every ~1.7min, rounded up to account for testing/error
// Can change this later to ~93600
export const API_TIMEOUT = 100000;

export const CRYPTO_ENDPOINT = 'wss://ws-feed.exchange.coinbase.com';
export const STOCK_ENDPOINT = 'https://financialmodelingprep.com/api/v3/quote/';

export const DEFAULT_TICKER = {
  curPrice: 0,
  prevPrice: 0,
  dayPercentage: 0,
  dirFilter: 'fill-emerald-500 -rotate-90',
  status: 'CONNECTING'
} as TickerData;
