export type TickerType = 'STOCK' | 'CRYPTO' | undefined;

export interface TickerData {
  id: string;
  curPrice: number;
  volume: number;
  prevPrice: number;
  dayPercentage: number;
  dirFilter: string;
  status: StatusType;
  type: TickerType;
}

export interface ApiRequestData {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  exchange: string;
  volume: number;
  avgVolume: number;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  earningsAnnouncement: string;
  sharesOutstanding: number;
  timestamp: number;
}

export interface WebsocketData {
  best_ask: string;
  best_ask_size: string;
  best_bid: string;
  best_bid_size: string;
  high_24h: string;
  last_size: string;
  low_24h: string;
  open_24h: string;
  price: string;
  product_id: string;
  sequence: number;
  side: string;
  time: string;
  trade_id: number;
  type: string;
  volume_24h: string;
  volume_30d: string;
}

export type StatusType = 'CONNECTED' | 'CONNECTING' | 'UPDATED' | 'ERROR';

export type SizeType = 'SMALL' | 'MEDIUM' | 'LARGE';

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
  SMALL: {
    boxSize: { X: '1/4', Y: '1/3' },
    name: 'text-l',
    price: 'text-l max-w-40',
    status: 'text-l',
    padding: 'pt-1',
    iconSize: 'h-3',
    vol: 'hidden',
    percent: 'text-sm w-full text-left'
  },
  MEDIUM: {
    boxSize: { X: '1/2', Y: '1/2' },
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

export const defaultTicker = {
  curPrice: -1,
  prevPrice: -1,
  dayPercentage: -1,
  dirFilter: 'fill-emerald-500 -rotate-90',
  status: 'CONNECTING',
  type: undefined
} as TickerData;
