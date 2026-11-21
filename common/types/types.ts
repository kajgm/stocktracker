// Wire types shared between the server and the client (the client keeps a
// copy in client/src/types/types.ts because its build context is client/).

export type TickerType = 'STOCK' | 'CRYPTO';

/** Latest price for one ticker, normalized across data sources. */
export interface TickerQuote {
  symbol: string;
  type: TickerType;
  price: number;
  /** Percent change since the previous close (stocks) or 24h open (crypto). */
  changePercent: number;
  /** Day volume. Not provided by Finnhub's free quote endpoint. */
  volume?: number;
  /** Unix epoch milliseconds of the quote. */
  timestamp: number;
}

/** A ticker the server could not fetch (unknown symbol, provider error). */
export interface TickerError {
  symbol: string;
  type: TickerType;
  message: string;
}

export interface TickerLists {
  stock: string[];
  crypto: string[];
}

/** Socket.IO events the server emits to clients. */
export interface ServerToClientEvents {
  updateTickers: (tickers: TickerLists) => void;
  tickerUpdate: (quote: TickerQuote) => void;
  tickerError: (error: TickerError) => void;
}

/** One chart point: [time in ms, price]. */
export type HistoryPoint = [number, number];

export type HistoryRange = '1h' | '6h' | '1d' | '5d';

/** Response of GET /api/history/:type/:symbol. */
export interface TickerHistory {
  symbol: string;
  type: TickerType;
  range: HistoryRange;
  points: HistoryPoint[];
}
