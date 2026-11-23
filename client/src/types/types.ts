// --- Wire types: keep in sync with common/types/types.ts on the server. ---

export type TickerType = 'STOCK' | 'CRYPTO';

export interface TickerQuote {
  symbol: string;
  type: TickerType;
  price: number;
  /** Percent change since the previous close (stocks) or 24h open (crypto). */
  changePercent: number;
  /** Day volume. Not provided for stocks (Finnhub free quote endpoint). */
  volume?: number;
  timestamp: number;
}

export interface TickerError {
  symbol: string;
  type: TickerType;
  message: string;
}

export interface TickerLists {
  stock: string[];
  crypto: string[];
}

// --- UI state ---

export type StatusType = 'CONNECTED' | 'CONNECTING' | 'ERROR';

export interface TickerData {
  id: string;
  type: TickerType;
  curPrice: number;
  volume?: number;
  dayPercentage: number;
  status: StatusType;
  /** Provider timestamp of the latest quote (ms). */
  quoteTime: number;
  /** When this display last received a quote for the ticker (ms). */
  receivedAt: number;
  /** Reason for status 'ERROR'. */
  error?: string;
}

/** A fresh placeholder for a ticker with no quote yet. */
export function defaultTicker(id = '', type: TickerType = 'STOCK'): TickerData {
  return {
    id,
    type,
    curPrice: -1,
    dayPercentage: 0,
    status: 'CONNECTING',
    quoteTime: 0,
    receivedAt: 0
  };
}

export type SizeType = 'XSMALL' | 'SMALL' | 'MEDIUM' | 'LARGE';

export interface SizeInfo {
  boxSize: { X: string; Y: string };
  name: string;
  price: string;
  status: string;
  /** Error message (smaller than status: it can be long). */
  error: string;
  padding: string;
  /** Volume, "Fri close" and error hints. */
  vol: string;
  percent: string;
}

export type TypeSizeMap = {
  [key in SizeType]: SizeInfo;
};

export const SizeMap: TypeSizeMap = {
  XSMALL: {
    boxSize: { X: 'w-1/4 max-w-1/4', Y: 'h-1/3 max-h-1/3' },
    name: 'text-sm',
    price: 'text-base',
    status: 'text-sm',
    error: 'text-sm',
    padding: 'pt-1',
    vol: 'hidden',
    percent: 'text-sm w-full text-left'
  },
  SMALL: {
    boxSize: { X: 'w-1/3 max-w-1/3', Y: 'h-1/2 max-h-1/2' },
    name: 'text-base',
    price: 'text-xl',
    status: 'text-base',
    error: 'text-base',
    padding: 'pt-2',
    vol: 'hidden',
    percent: 'text-lg w-full text-left'
  },
  MEDIUM: {
    boxSize: { X: 'w-1/2 max-w-1/2', Y: 'h-1/2 max-h-1/2' },
    name: 'text-xl',
    price: 'text-3xl',
    status: 'text-xl',
    error: 'text-xl',
    padding: 'pt-1',
    vol: 'text-sm text-left',
    percent: 'text-xl text-right'
  },
  LARGE: {
    boxSize: { X: 'full', Y: 'full' },
    name: 'text-3xl',
    price: 'text-7xl',
    status: 'text-3xl',
    error: 'text-4xl',
    padding: 'pl-4 pt-6',
    vol: 'text-xl pb-2 text-left',
    percent: 'text-4xl pb-2 text-right'
  }
};
