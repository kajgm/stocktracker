import type { TickerType } from '@/types/types';
import type { HistoryRange, TickerHistory } from '@/types/history';

// Same origin by default (nginx or the Vite dev server proxy /api), like the socket.
const API_BASE = (import.meta.env.VITE_SERVER_URL ?? '').replace(/\/$/, '');

export async function fetchHistory(
  type: TickerType,
  symbol: string,
  range: HistoryRange,
  points = 240
): Promise<TickerHistory> {
  const url = `${API_BASE}/api/history/${type.toLowerCase()}/${encodeURIComponent(symbol)}?range=${range}&points=${points}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as TickerHistory;
}
