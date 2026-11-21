// Wire types for GET /api/history: keep in sync with common/types/types.ts on the server.
import type { TickerType } from './types';

/** One chart point: [time in ms, price]. */
export type HistoryPoint = [number, number];

export type HistoryRange = '1h' | '6h' | '1d' | '5d';

export const HISTORY_RANGES: HistoryRange[] = ['1h', '6h', '1d', '5d'];

export interface TickerHistory {
  symbol: string;
  type: TickerType;
  range: HistoryRange;
  points: HistoryPoint[];
}
