export type TickerType = 'STOCK' | 'CRYPTO';

export interface TickerData {
  id: string;
  curPrice: number;
  volume: number;
  prevPrice: number;
  dirFilter: string;
  status: StatusType;
}

export type StatusType = 'CONNECTED' | 'CONNECTING' | 'ERROR';
