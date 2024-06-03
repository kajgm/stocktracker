export interface TickerType {
  id: string;
  currentPrice: string;
  volume: string;
  previousPrice: string;
}

export type Status = 'connected' | 'connecting' | 'error' | 'idle';
