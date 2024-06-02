export interface TickerType {
  id: String;
  price: String;
  volume: String;
}

export type Status = 'connected' | 'connecting' | 'error' | 'idle';
