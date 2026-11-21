import { defineStore } from 'pinia';
import socket from '@/socket/socket';
import { defaultTicker, SizeMap } from '@/types/types';
import type {
  TickerData,
  StatusType,
  TickerType,
  SizeInfo,
  TickerQuote,
  TickerError,
  TickerLists
} from '@/types/types';

interface State {
  cryptoDataMap: Map<string, TickerData>;
  stockDataMap: Map<string, TickerData>;
  /** Connection to the stocktracker server. */
  connection: StatusType;
  /** Whether the server has sent the ticker lists yet. */
  tickersLoaded: boolean;
}

export const useTickerStore = defineStore('ticker', {
  state: (): State => ({
    cryptoDataMap: new Map<string, TickerData>(),
    stockDataMap: new Map<string, TickerData>(),
    connection: 'CONNECTING',
    tickersLoaded: false
  }),
  getters: {
    cryptoValue(): (key: string) => TickerData {
      return (key: string) => this.cryptoDataMap.get(key) ?? defaultTicker(key, 'CRYPTO');
    },
    cryptoKeys(): string[] {
      return Array.from(this.cryptoDataMap.keys());
    },
    stockValue(): (key: string) => TickerData {
      return (key: string) => this.stockDataMap.get(key) ?? defaultTicker(key, 'STOCK');
    },
    stockKeys(): string[] {
      return Array.from(this.stockDataMap.keys());
    },
    tickerCount(): number {
      return this.stockDataMap.size + this.cryptoDataMap.size;
    },
    tickerSizeInfo(): SizeInfo {
      const total = this.tickerCount;
      if (total <= 1) return SizeMap.LARGE;
      if (total <= 4) return SizeMap.MEDIUM;
      if (total <= 6) return SizeMap.SMALL;
      return SizeMap.XSMALL;
    }
  },
  actions: {
    bindEvents() {
      socket.on('connect', () => (this.connection = 'CONNECTED'));
      socket.on('disconnect', () => (this.connection = 'CONNECTING'));
      socket.on('connect_error', () => (this.connection = 'ERROR'));
      socket.on('updateTickers', (msg: TickerLists) => this.setTickers(msg));
      socket.on('tickerUpdate', (msg: TickerQuote) => this.applyQuote(msg));
      socket.on('tickerError', (msg: TickerError) => this.applyError(msg));
    },
    mapFor(type: TickerType): Map<string, TickerData> {
      return type === 'CRYPTO' ? this.cryptoDataMap : this.stockDataMap;
    },
    /** Match the configured lists: keep data for existing tickers, add placeholders, drop removed ones. */
    setTickers(lists: TickerLists) {
      const rebuild = (ids: string[], type: TickerType) => {
        const current = this.mapFor(type);
        return new Map(ids.map((id) => [id, current.get(id) ?? defaultTicker(id, type)]));
      };
      this.cryptoDataMap = rebuild(lists.crypto, 'CRYPTO');
      this.stockDataMap = rebuild(lists.stock, 'STOCK');
      this.tickersLoaded = true;
    },
    applyQuote(quote: TickerQuote) {
      const map = this.mapFor(quote.type);
      const prev = map.get(quote.symbol);
      if (!prev) return; // not (or no longer) configured
      map.set(quote.symbol, {
        id: quote.symbol,
        type: quote.type,
        curPrice: quote.price,
        volume: quote.volume,
        dayPercentage: quote.changePercent,
        status: 'CONNECTED',
        quoteTime: quote.timestamp,
        receivedAt: Date.now()
      });
    },
    applyError(error: TickerError) {
      const map = this.mapFor(error.type);
      const prev = map.get(error.symbol);
      if (prev) map.set(error.symbol, { ...prev, status: 'ERROR', error: error.message });
    }
  }
});
