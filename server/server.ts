import express from 'express';
import morgan from 'morgan';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type { ServerToClientEvents } from '../common/types/types.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { CoinbaseFeed } from './feeds/coinbase.js';
import { FinnhubPoller } from './feeds/finnhub.js';
import { apiRouter } from './routes/api.js';
import { registerSocket } from './routes/socket.js';
import { QuoteStore } from './services/quoteStore.js';
import { TickerConfig } from './services/tickerConfig.js';

const persist = Boolean(env.mongoUri);
if (persist) {
  await connectDB(env.mongoUri!);
} else {
  console.log('MONGO_URI not set; ticker lists are kept in memory');
}

const tickers = new TickerConfig(
  { stock: env.defaultStockTickers, crypto: env.defaultCryptoTickers },
  persist,
  env.configUser
);
await tickers.load();

const quotes = new QuoteStore();
const stocks = new FinnhubPoller(quotes, {
  apiKey: env.finnhubApiKey,
  baseUrl: env.finnhubBaseUrl,
  intervalMs: env.stockPollIntervalMs
});
const crypto = new CoinbaseFeed(quotes, env.coinbaseWsUrl);

// Restart a feed only when its own list changed (a reconnect or a burst of
// API calls is not free).
let active = tickers.get();
const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((s, i) => s === b[i]);
tickers.on('change', (lists) => {
  quotes.retain('STOCK', lists.stock);
  quotes.retain('CRYPTO', lists.crypto);
  if (!sameList(lists.stock, active.stock)) stocks.setTickers(lists.stock);
  if (!sameList(lists.crypto, active.crypto)) crypto.setTickers(lists.crypto);
  active = lists;
});

const app = express();
app.disable('x-powered-by');
app.use(express.json());
app.use(morgan('dev'));
app.use('/api', apiRouter(tickers));

const server = createServer(app);
const io = new Server<object, ServerToClientEvents>(server, { cors: { origin: env.corsOrigins } });
registerSocket(io, quotes, tickers);

stocks.start(active.stock);
crypto.start(active.crypto);

server.listen(env.port, () => {
  console.log(`Stocktracker server listening on port ${env.port}`);
  console.log(`Tickers: stock=[${active.stock.join(',')}] crypto=[${active.crypto.join(',')}]`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  stocks.stop();
  crypto.stop();
  await io.close(); // also closes the HTTP server
  if (persist) await disconnectDB();
  process.exit(0);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
