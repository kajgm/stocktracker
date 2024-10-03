import { defineStore } from 'pinia';
import { type TickerData, type StatusType, type TickerType } from '@/types/types.js';

interface State {
  tickerDataMap: Map<string, TickerData>;
  status: {
    overall: StatusType;
    api: StatusType;
    socket: StatusType;
  };
}

const defaultTicker = {
  curPrice: -1,
  prevPrice: -1,
  dayPercentage: -1,
  dirFilter: 'fill-emerald-500 -rotate-90',
  status: 'CONNECTING',
  type: undefined
} as TickerData;

export const useTickerStore = defineStore('ticker', {
  state: (): State => ({
    tickerDataMap: new Map<string, TickerData>(),
    status: { overall: 'CONNECTING', api: 'CONNECTING', socket: 'CONNECTING' }
  }),
  getters: {
    tickerValue(): (key: string) => TickerData {
      return (key: string) => this.tickerDataMap.get(key) || defaultTicker;
    },
    tickerData(): Map<string, TickerData> {
      return this.tickerDataMap;
    },
    tickerKeys(): string[] {
      return Array.from(this.tickerDataMap.keys());
    },
    cryptoTickers(): string[] {
      return [...this.tickerDataMap.entries()].filter(({ 1: v }) => v.type == 'CRYPTO').map(([k]) => k);
    },
    stockTickers(): string[] {
      return [...this.tickerDataMap.entries()].filter(({ 1: v }) => v.type == 'STOCK').map(([k]) => k);
    },
    overallStatus(): StatusType {
      return this.status.overall;
    },
    apiStatus(): StatusType {
      return this.status.api;
    },
    socketStatus(): StatusType {
      return this.status.socket;
    }
  },
  actions: {
    setApiStatus(status: StatusType) {
      this.status.api = status;
      if (this.status.socket == 'CONNECTED' || this.status.api == 'CONNECTED') {
        this.status.overall = 'CONNECTED';
      } else {
        this.status.overall = 'CONNECTING';
      }
    },
    setSocketStatus(status: StatusType) {
      this.status.socket = status;
      if (this.status.socket == 'CONNECTED' || this.status.api == 'CONNECTED') {
        this.status.overall = 'CONNECTED';
      } else {
        this.status.overall = 'CONNECTING';
      }
    },
    updateTickerData(key: string, tData: TickerData) {
      this.tickerDataMap.set(key, tData);
    },
    addNewTicker(id: string, type: TickerType, tData?: TickerData) {
      const tickerData = tData ? tData : defaultTicker;
      tickerData.type = type;
      this.updateTickerData(id, tickerData);
    },
    clearCryptoTickers() {
      this.tickerDataMap = new Map([...[...this.tickerDataMap].filter(([k, v]) => v.type != 'CRYPTO')]);
    },
    clearStockTickers() {
      this.tickerDataMap = new Map([...[...this.tickerDataMap].filter(([k, v]) => v.type != 'STOCK')]);
    }
  }
});
