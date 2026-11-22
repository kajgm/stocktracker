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

async function send<T>(path: string, init: RequestInit = {}): Promise<Partial<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { cache: 'no-store', ...init });
  } catch {
    throw new ApiError(0, "Couldn't reach the server. Check your connection and try again.");
  }
  const body = (await res.json().catch(() => ({}))) as Partial<T> & { error?: string };
  if (res.ok) return body;
  if (res.status == 401) throw new ApiError(401, 'The admin token is wrong or missing.');
  throw new ApiError(res.status, body.error ?? `The server returned HTTP ${res.status}.`);
}

async function request(path: string, init: RequestInit = {}): Promise<TickerLists> {
  const body = await send<TickerLists>(path, init);
  return { stock: body.stock ?? [], crypto: body.crypto ?? [] };
}

const authHeaders = (token: string): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {});

/**
 * Check a token before editing. Resolves when it is valid or the server needs
 * none (`required` says which); rejects with a 401 ApiError when it is wrong.
 */
export async function checkToken(token: string): Promise<{ required: boolean }> {
  const body = await send<{ required: boolean }>('/api/auth', { headers: authHeaders(token) });
  return { required: body.required ?? true };
}

export function getTickers(): Promise<TickerLists> {
  return request('/api/tickers');
}

/** Replace both lists. `token` is sent only when given (servers without ADMIN_TOKEN don't need one). */
export function saveTickers(lists: TickerLists, token: string): Promise<TickerLists> {
  const headers = { 'Content-Type': 'application/json', ...authHeaders(token) };
  return request('/api/tickers', { method: 'PUT', headers, body: JSON.stringify(lists) });
}
