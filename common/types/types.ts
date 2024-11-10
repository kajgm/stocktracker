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
  name: string;
  price: string;
  status: string;
  padding: string;
  iconSize: string;
  info: string;
}

export type TypeSizeMap = {
  [key in SizeType]: SizeInfo;
};

export const defaultTicker = {
  curPrice: -1,
  prevPrice: -1,
  dayPercentage: -1,
  dirFilter: 'fill-emerald-500 -rotate-90',
  status: 'CONNECTING',
  type: undefined
} as TickerData;
