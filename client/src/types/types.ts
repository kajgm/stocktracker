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
  prevPrice: number;
  volume?: number;
  dayPercentage: number;
  dirFilter: string;
  status: StatusType;
}

export const UP_FILTER = 'fill-emerald-500 -rotate-90';
export const DOWN_FILTER = 'fill-red-500 rotate-90';

/** A fresh placeholder for a ticker with no quote yet. */
export function defaultTicker(id = '', type: TickerType = 'STOCK'): TickerData {
  return {
    id,
    type,
    curPrice: -1,
    prevPrice: -1,
    dayPercentage: 0,
    dirFilter: UP_FILTER,
    status: 'CONNECTING'
  };
}

export type SizeType = 'XSMALL' | 'SMALL' | 'MEDIUM' | 'LARGE';

export interface SizeInfo {
  boxSize: { X: string; Y: string };
  name: string;
  price: string;
  status: string;
  padding: string;
  iconSize: string;
  vol: string;
  percent: string;
}

export type TypeSizeMap = {
  [key in SizeType]: SizeInfo;
};

export const SizeMap: TypeSizeMap = {
  XSMALL: {
    boxSize: { X: 'w-1/4 max-w-1/4', Y: 'h-1/3 max-h-1/3' },
    name: 'text-l',
    price: 'text-l max-w-40',
    status: 'text-l',
    padding: 'pt-1',
    iconSize: 'h-3',
    vol: 'hidden',
    percent: 'text-l w-full text-left'
  },
  SMALL: {
    boxSize: { X: 'w-1/3 max-w-1/3', Y: 'h-1/2 max-h-1/2' },
    name: 'text-2xl',
    price: 'text-2xl max-w-40',
    status: 'text-2xl',
    padding: 'pt-2',
    iconSize: 'h-4',
    vol: 'hidden',
    percent: 'text-2xl w-full text-left'
  },
  MEDIUM: {
    boxSize: { X: 'w-1/2 max-w-1/2', Y: 'h-1/2 max-h-1/2' },
    name: 'text-4xl',
    price: 'text-4xl max-w-40',
    status: 'text-4xl',
    padding: '',
    iconSize: 'h-5',
    vol: 'text-2xl w-1/2 text-left',
    percent: 'text-2xl w-1/2 text-right'
  },
  LARGE: {
    boxSize: { X: 'full', Y: 'full' },
    name: 'text-6xl',
    price: 'text-7xl',
    status: 'text-6xl',
    padding: 'pl-4 pt-6',
    iconSize: 'h-10',
    vol: 'text-5xl pb-2 w-1/2 text-left',
    percent: 'text-5xl pb-2 w-1/2 text-right'
  }
};
