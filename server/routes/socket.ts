import type { Server } from 'socket.io';
import type { ServerToClientEvents, TickerQuote } from '../../common/types/types.js';
import type { QuoteStore } from '../services/quoteStore.js';
import type { TickerConfig } from '../services/tickerConfig.js';

// Crypto tickers can update many times a second. Batch to at most one update
// per ticker per interval so small displays (Raspberry Pi) aren't flooded.
const BROADCAST_INTERVAL_MS = 500;

export function registerSocket(io: Server<object, ServerToClientEvents>, quotes: QuoteStore, tickers: TickerConfig) {
  const pending = new Map<string, TickerQuote>();

  quotes.on('quote', (quote) => pending.set(`${quote.type}:${quote.symbol}`, quote));
  quotes.on('error', (error) => io.emit('tickerError', error));
  tickers.on('change', (lists) => io.emit('updateTickers', lists));

  setInterval(() => {
    for (const quote of pending.values()) io.emit('tickerUpdate', quote);
    pending.clear();
  }, BROADCAST_INTERVAL_MS).unref();

  io.on('connection', (socket) => {
    socket.emit('updateTickers', tickers.get());
    const snapshot = quotes.snapshot();
    for (const quote of snapshot.quotes) socket.emit('tickerUpdate', quote);
    for (const error of snapshot.errors) socket.emit('tickerError', error);
  });
}
