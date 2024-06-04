export interface TickerType {
  id: string;
  curPrice: string;
  volume: string;
  prevPrice: string;
  dirFilter: string;
}

export type Status = 'connected' | 'connecting' | 'error' | 'idle';
