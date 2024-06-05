export interface TickerType {
  id: string;
  curPrice: string;
  volume: string;
  prevPrice: string;
  dirFilter: string;
  status: StatusType;
}

export type StatusType = 'connected' | 'connecting' | 'error' | 'idle';
