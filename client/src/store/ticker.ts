import { defineStore } from 'pinia';
import type { TickerData, StatusType, TickerType, SizeInfo } from '@/types/types.js';
import { defaultTicker, SizeMap } from '@/types/types.js';

interface State {
  cryptoDataMap: Map<string, TickerData>;
  stockDataMap: Map<string, TickerData>;
  status: {
    overall: StatusType;
    stock: StatusType;
    crypto: StatusType;
  };
  cSocket: WebSocket | undefined;
}

export const useTickerStore = defineStore('ticker', {
  state: (): State => ({
    cryptoDataMap: new Map<string, TickerData>(),
    stockDataMap: new Map<string, TickerData>(),
    status: { overall: 'CONNECTING', stock: 'CONNECTING', crypto: 'CONNECTING' },
    cSocket: undefined
  }),
  getters: {
    cryptoValue(): (key: string) => TickerData {
      return (key: string) => this.cryptoDataMap.get(key) || defaultTicker;
    },
    cryptoData(): Map<string, TickerData> {
      return this.cryptoDataMap;
    },
    cryptoKeys(): string[] {
      return Array.from(this.cryptoDataMap.keys());
    },
    stockValue(): (key: string) => TickerData {
      return (key: string) => this.stockDataMap.get(key) || defaultTicker;
    },
    stockData(): Map<string, TickerData> {
      return this.stockDataMap;
    },
    stockKeys(): string[] {
      return Array.from(this.stockDataMap.keys());
    },
    cryptoSocket(): WebSocket {
      return this.cSocket;
    },
    overallStatus(): StatusType {
      return this.status.overall;
    },
    stockStatus(): StatusType {
      return this.status.stock;
    },
    cryptoStatus(): StatusType {
      return this.status.crypto;
    },
    tickerSizeInfo(): SizeInfo {
      const totalNumTickers =
        Array.from(this.stockDataMap.keys()).length + Array.from(this.cryptoDataMap.keys()).length;
      if (totalNumTickers == 1) {
        return SizeMap.LARGE;
      } else if (totalNumTickers <= 4) {
        return SizeMap.MEDIUM;
      } else {
        return SizeMap.SMALL;
      }
    }
  },
  actions: {
    setExtStatus(status: StatusType, type: TickerType) {
      if (type == 'CRYPTO') this.status.crypto = status;
      if (type == 'STOCK') this.status.stock = status;
      if (this.status.crypto == 'CONNECTED' || this.status.stock == 'CONNECTED') {
        this.status.overall = 'CONNECTED';
      } else {
        this.status.overall = 'CONNECTING';
      }
    },
    setSocket(socket: WebSocket | undefined) {
      this.cSocket = socket;
    },
    updateCryptoData(key: string, tData: TickerData) {
      this.cryptoDataMap.set(key, tData);
    },
    updateStockData(key: string, tData: TickerData) {
      this.stockDataMap.set(key, tData);
    },
    addNewTicker(id: string, type: TickerType, tData?: TickerData) {
      const tickerData = tData ? tData : defaultTicker;
      tickerData.type = type;
      if (type == 'CRYPTO') this.updateCryptoData(id, tickerData);
      if (type == 'STOCK') this.updateStockData(id, tickerData);
    },
    clearCryptoTickers() {
      this.cryptoDataMap = new Map<string, TickerData>();
    },
    clearStockTickers() {
      this.stockDataMap = new Map<string, TickerData>();
    }
  }
});
