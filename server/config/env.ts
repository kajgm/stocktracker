import { parseTickerList } from '../lib/tickers.js';

// Load .env for local development; in containers the variables are set directly.
try {
  process.loadEnvFile();
} catch {
  // no .env file
}

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer, got "${raw}"`);
  }
  return value;
}

function listFromEnv(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = {
  port: intFromEnv('PORT', 3000),

  /** When set, ticker lists persist in MongoDB; otherwise they live in memory. */
  mongoUri: process.env.MONGO_URI || undefined,
  /** Key of the ticker-list document in MongoDB. */
  configUser: process.env.DB_USER || 'localhost',

  /** Tickers used until a list is stored (via the API) or when running without MongoDB. */
  defaultStockTickers: parseTickerList(process.env.STOCK_TICKERS ?? '', 'STOCK'),
  defaultCryptoTickers: parseTickerList(process.env.CRYPTO_TICKERS ?? '', 'CRYPTO'),

  finnhubApiKey: process.env.FINNHUB_API_KEY || undefined,
  finnhubBaseUrl: process.env.FINNHUB_BASE_URL || 'https://finnhub.io/api/v1',
  /** How often every stock ticker is re-quoted while the US market is open. */
  stockPollIntervalMs: intFromEnv('STOCK_POLL_INTERVAL_MS', 60_000),

  coinbaseWsUrl: process.env.CRYPTO_ENDPOINT || 'wss://ws-feed.exchange.coinbase.com',

  corsOrigins: listFromEnv('CORS_ORIGINS', ['http://localhost:8080', 'http://localhost:5173'])
};
