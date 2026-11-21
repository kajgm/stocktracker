import type { TickerLists } from '@/types/types';

// Same origin by default (nginx or the Vite dev server proxy /api), like the socket.
const API_BASE = (import.meta.env.VITE_SERVER_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

async function request(path: string, init: RequestInit = {}): Promise<TickerLists> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { cache: 'no-store', ...init });
  } catch {
    throw new ApiError(0, "Couldn't reach the server. Check your connection and try again.");
  }
  const body = (await res.json().catch(() => ({}))) as Partial<TickerLists> & { error?: string };
  if (res.ok) return { stock: body.stock ?? [], crypto: body.crypto ?? [] };
  if (res.status == 401) throw new ApiError(401, 'The admin token is wrong or missing.');
  throw new ApiError(res.status, body.error ?? `The server returned HTTP ${res.status}.`);
}

export function getTickers(): Promise<TickerLists> {
  return request('/api/tickers');
}

/** Replace both lists. `token` is sent only when given (servers without ADMIN_TOKEN don't need one). */
export function saveTickers(lists: TickerLists, token: string): Promise<TickerLists> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return request('/api/tickers', { method: 'PUT', headers, body: JSON.stringify(lists) });
}
