export type TickerType = 'STOCK' | 'CRYPTO';

export interface TickerData {
  id: string;
  curPrice: number;
  volume: string;
  prevPrice: number;
  dirFilter: string;
  status: StatusType;
}

export type StatusType = 'CONNECTED' | 'CONNECTING' | 'ERROR';
