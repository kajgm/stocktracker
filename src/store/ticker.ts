import { defineStore } from 'pinia';
import { type TickerData, type StatusType, type TickerType } from '@/types/types';
import { DEFAULT_TICKER } from '@/defaults/defaults';

interface State {
  stockTickers: string[];
  cryptoTickers: string[];
  tickerDataMap: Map<string, TickerData>;
  status: {
    overall: StatusType;
    api: StatusType;
    socket: StatusType;
  };
}

export const useTickerStore = defineStore('ticker', {
  state: (): State => ({
    stockTickers: [],
    cryptoTickers: [],
    tickerDataMap: new Map<string, TickerData>(),
    status: { overall: 'CONNECTING', api: 'CONNECTING', socket: 'CONNECTING' }
  }),
  getters: {
    tickerValue(): (key: string) => TickerData {
      return (key: string) => this.tickerDataMap.get(key) || DEFAULT_TICKER;
    },
    tickerData(): Map<string, TickerData> {
      return this.tickerDataMap;
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
    updateTickerData(key: string, ticker: TickerData) {
      this.tickerDataMap.set(key, ticker);
    },
    addNewTicker(id: string, type: TickerType, ticker?: TickerData) {
      if (type == 'STOCK') {
        this.stockTickers.push(id);
      } else if (type == 'CRYPTO') {
        this.cryptoTickers.push(id);
      } else {
        console.log('Error: not a valid type!');
      }
      this.updateTickerData(id, ticker || DEFAULT_TICKER);
    }
  }
});
