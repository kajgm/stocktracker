import express from 'express';
import morgan from 'morgan';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type { ServerToClientEvents } from '../common/types/types.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { CoinbaseFeed } from './feeds/coinbase.js';
import { fetchCoinbaseHistory } from './feeds/coinbaseHistory.js';
import { FinnhubPoller } from './feeds/finnhub.js';
import { apiRouter } from './routes/api.js';
import { historyRouter } from './routes/history.js';
import { registerSocket } from './routes/socket.js';
import { loadHistoryFile, saveHistoryFile } from './services/historyFile.js';
import { HistoryStore } from './services/historyStore.js';
import { QuoteStore } from './services/quoteStore.js';
import { TickerConfig } from './services/tickerConfig.js';
import { FileTickerStore, MongoTickerStore, type TickerStore } from './services/tickerStore.js';

if (env.tickersFile && env.mongoUri) {
  throw new Error('Set TICKERS_FILE or MONGO_URI, not both');
}
let store: TickerStore | undefined;
if (env.mongoUri) {
  await connectDB(env.mongoUri);
  store = new MongoTickerStore(env.configUser);
} else if (env.tickersFile) {
  store = new FileTickerStore(env.tickersFile);
} else {
  console.log('TICKERS_FILE and MONGO_URI not set; ticker changes last until restart');
}

const tickers = new TickerConfig({ stock: env.defaultStockTickers, crypto: env.defaultCryptoTickers }, store);
if ((await tickers.load()) === 'stored') {
  console.log(`Using tickers saved in ${store!.description} (STOCK_TICKERS/CRYPTO_TICKERS are ignored)`);
}

const quotes = new QuoteStore();
const stocks = new FinnhubPoller(quotes, {
  apiKey: env.finnhubApiKey,
  baseUrl: env.finnhubBaseUrl,
  intervalMs: env.stockPollIntervalMs
});
const crypto = new CoinbaseFeed(quotes, env.coinbaseWsUrl);

// Chart history: every quote, in one-minute buckets. Saved to HISTORY_FILE
// (when set) every 5 minutes and on shutdown, so stock charts survive a restart.
const history = new HistoryStore();
if (env.historyFile) await loadHistoryFile(history, env.historyFile);
quotes.on('quote', (quote) => history.record(quote));
const HISTORY_SAVE_MS = 5 * 60_000;
const historySaver = env.historyFile
  ? setInterval(() => void saveHistoryFile(history, env.historyFile!), HISTORY_SAVE_MS)
  : undefined;

/** Fill in the last ~24 h for crypto tickers with no history yet (Coinbase REST, no key). */
function backfillCrypto(symbols: string[]) {
  for (const symbol of symbols) {
    if (history.has('CRYPTO', symbol)) continue;
    fetchCoinbaseHistory(symbol, env.coinbaseRestUrl)
      .then((points) => history.seed('CRYPTO', symbol, points))
      .catch((e: Error) => console.error(`Coinbase history ${symbol}: ${e.message}`));
  }
}

// Restart a feed only when its own list changed (a reconnect or a burst of
// API calls is not free).
let active = tickers.get();
const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((s, i) => s === b[i]);
tickers.on('change', (lists) => {
  quotes.retain('STOCK', lists.stock);
  quotes.retain('CRYPTO', lists.crypto);
  history.retain('STOCK', lists.stock);
  history.retain('CRYPTO', lists.crypto);
  if (!sameList(lists.stock, active.stock)) stocks.setTickers(lists.stock);
  if (!sameList(lists.crypto, active.crypto)) {
    crypto.setTickers(lists.crypto);
    backfillCrypto(lists.crypto);
  }
  active = lists;
});

const app = express();
app.disable('x-powered-by');
// Probe target, registered before the logger so probes don't flood the log.
app.get('/healthz', (_req, res) => {
  res.type('text/plain').send('ok\n');
});
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'short' : 'dev'));
app.use('/api/history', historyRouter(history, tickers));
app.use('/api', apiRouter(tickers, env.adminToken));

if (!env.adminToken) {
  console.warn('ADMIN_TOKEN not set; anyone who can reach /api can change tickers');
}

const server = createServer(app);
const io = new Server<object, ServerToClientEvents>(server, { cors: { origin: env.corsOrigins } });
registerSocket(io, quotes, tickers);

stocks.start(active.stock);
crypto.start(active.crypto);
backfillCrypto(active.crypto);

server.listen(env.port, () => {
  console.log(`Stocktracker server listening on port ${env.port}`);
  console.log(`Tickers: stock=[${active.stock.join(',')}] crypto=[${active.crypto.join(',')}]`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  stocks.stop();
  crypto.stop();
  clearInterval(historySaver);
  if (env.historyFile) await saveHistoryFile(history, env.historyFile);
  await io.close(); // also closes the HTTP server
  if (env.mongoUri) await disconnectDB();
  process.exit(0);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
