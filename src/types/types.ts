export interface TickerType {
  id: string;
  curPrice: number;
  volume: number;
  prevPrice: number;
  dirFilter: string;
  status: StatusType;
}

export type StatusType = 'CONNECTED' | 'CONNECTING' | 'ERROR' | 'IDLE';
