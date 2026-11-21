import type { TickerQuote } from '../../common/types/types.js';
import type { QuoteStore } from '../services/quoteStore.js';

/** `ticker` channel message: https://docs.cdp.coinbase.com/exchange/websocket-feed/channels#ticker-channel */
export interface CoinbaseTicker {
  type: 'ticker';
  product_id: string;
  price: string;
  open_24h: string;
  volume_24h: string;
  time: string;
}

interface CoinbaseError {
  type: 'error';
  message: string;
  reason?: string;
}

const MIN_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 5 * 60_000;
// Heartbeats arrive every second per product; silence means a dead connection.
const STALE_AFTER_MS = 30_000;

export function toTickerQuote(msg: CoinbaseTicker): TickerQuote {
  const price = parseFloat(msg.price);
  const open = parseFloat(msg.open_24h);
  return {
    symbol: msg.product_id,
    type: 'CRYPTO',
    price,
    changePercent: open ? ((price - open) / open) * 100 : 0,
    volume: parseFloat(msg.volume_24h),
    timestamp: Date.parse(msg.time) || Date.now()
  };
}

/**
 * Streams crypto prices from Coinbase's public WebSocket feed. Reconnects with
 * exponential backoff, and on a stale connection, so an unattended display
 * recovers by itself.
 */
export class CoinbaseFeed {
  private socket: WebSocket | undefined;
  private tickers: string[] = [];
  private running = false;
  private backoffMs = MIN_BACKOFF_MS;
  private reconnectTimer: NodeJS.Timeout | undefined;
  private staleTimer: NodeJS.Timeout | undefined;

  constructor(
    private readonly store: QuoteStore,
    private readonly url: string
  ) {}

  start(tickers: string[]): void {
    this.running = true;
    this.setTickers(tickers);
  }

  stop(): void {
    this.running = false;
    this.disconnect();
  }

  setTickers(tickers: string[]): void {
    this.tickers = [...tickers];
    this.backoffMs = MIN_BACKOFF_MS;
    this.disconnect();
    if (this.running && this.tickers.length) this.connect();
  }

  private connect(): void {
    const socket = new WebSocket(this.url);
    this.socket = socket;

    socket.onopen = () => {
      console.log(`Coinbase feed connected: ${this.tickers.join(',')}`);
      socket.send(JSON.stringify({ type: 'subscribe', product_ids: this.tickers, channels: ['heartbeat', 'ticker'] }));
      this.touch();
    };

    socket.onmessage = (e: MessageEvent) => {
      this.touch();
      let msg: CoinbaseTicker | CoinbaseError | { type: string };
      try {
        msg = JSON.parse(String(e.data)) as typeof msg;
      } catch {
        return;
      }
      if (msg.type === 'ticker') {
        this.backoffMs = MIN_BACKOFF_MS;
        this.store.set(toTickerQuote(msg as CoinbaseTicker));
      } else if (msg.type === 'error') {
        const err = msg as CoinbaseError;
        console.error(`Coinbase feed error: ${err.message}${err.reason ? ` (${err.reason})` : ''}`);
        socket.close();
      }
    };

    socket.onerror = () => {
      // onclose follows and schedules the reconnect.
    };

    socket.onclose = () => {
      if (this.socket !== socket) return; // replaced by setTickers()
      this.socket = undefined;
      clearTimeout(this.staleTimer);
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (!this.running || !this.tickers.length) return;
    console.warn(`Coinbase feed closed; reconnecting in ${this.backoffMs / 1000}s`);
    this.reconnectTimer = setTimeout(() => this.connect(), this.backoffMs);
    this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS);
  }

  private touch(): void {
    clearTimeout(this.staleTimer);
    const socket = this.socket;
    this.staleTimer = setTimeout(() => {
      console.warn('Coinbase feed stale; reconnecting');
      socket?.close();
    }, STALE_AFTER_MS);
  }

  private disconnect(): void {
    clearTimeout(this.reconnectTimer);
    clearTimeout(this.staleTimer);
    const socket = this.socket;
    this.socket = undefined;
    socket?.close();
  }
}
