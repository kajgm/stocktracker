import { defineStore } from 'pinia';
import socket from '@/socket/socket.js';
import { priceDirection } from '@/helpers/helpers.js';
import { defaultTicker } from '@/types/types.js';
import type { TickerData, StatusType, TickerType, cryptoSocketData, stockSocketData } from '@/types/types.js';

interface State {
  cryptoDataMap: Map<string, TickerData>;
  stockDataMap: Map<string, TickerData>;
  status: {
    overall: StatusType;
    stock: StatusType;
    crypto: StatusType;
  };
}

export const useTickerStore = defineStore('ticker', {
  state: (): State => ({
    cryptoDataMap: new Map<string, TickerData>(),
    stockDataMap: new Map<string, TickerData>(),
    status: { overall: 'CONNECTING', stock: 'CONNECTING', crypto: 'CONNECTING' }
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
    overallStatus(): StatusType {
      return this.status.overall;
    },
    stockStatus(): StatusType {
      return this.status.stock;
    },
    cryptoStatus(): StatusType {
      return this.status.crypto;
    }
  },
  actions: {
    bindEvents() {
      socket.on('cryptoTicker', (data: string) => {
        const msg = JSON.parse(data) as cryptoSocketData;
        const prevRes = this.cryptoValue(msg.product_id);
        const curPrice = parseFloat(msg.price);
        const dayPrice = parseFloat(msg.open_24h);
        const tickerValue = {
          id: msg.product_id,
          curPrice: curPrice,
          volume: parseFloat(msg.volume_24h),
          dayPercentage: ((curPrice - dayPrice) / dayPrice) * 100,
          prevPrice: prevRes.curPrice,
          dirFilter: priceDirection(prevRes.dirFilter, curPrice, prevRes.prevPrice),
          status: 'CONNECTED',
          type: 'CRYPTO'
        } as TickerData;
        this.updateCryptoData(msg.product_id, tickerValue);
      });

      socket.on('stockTicker', (data: string) => {
        const msg = JSON.parse(data) as stockSocketData;
        const prevRes = this.stockValue(msg.symbol);
        const stock = {
          id: msg.symbol,
          curPrice: msg.price,
          volume: msg.volume,
          prevPrice: prevRes.curPrice,
          dayPercentage: msg.changesPercentage,
          dirFilter:
            prevRes.curPrice == -1
              ? priceDirection(prevRes.dirFilter, msg.changesPercentage, 0)
              : priceDirection(prevRes.dirFilter, msg.price, prevRes.prevPrice),
          status: 'CONNECTED',
          type: 'STOCK'
        } as TickerData;
        this.updateStockData(msg.symbol, stock);
      });
    },
    setExtStatus(status: StatusType, type: TickerType) {
      if (type == 'CRYPTO') this.status.crypto = status;
      if (type == 'STOCK') this.status.stock = status;
      if (this.status.crypto == 'CONNECTED' || this.status.stock == 'CONNECTED') {
        this.status.overall = 'CONNECTED';
      } else {
        this.status.overall = 'CONNECTING';
      }
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
