import { defineStore } from 'pinia';
import socket from '@/socket/socket.js';
import { priceDirection } from '@/helpers/helpers.js';
import { defaultTicker, SizeMap } from '@/types/types.js';
import type { TickerData, StatusType, TickerType, cryptoSocketData, stockSocketData, SizeInfo } from '@/types/types.js';

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
    },
    tickerSizeInfo(): SizeInfo {
      const totalNumTickers =
        Array.from(this.stockDataMap.keys()).length + Array.from(this.cryptoDataMap.keys()).length;
      if (totalNumTickers == 1) {
        return SizeMap.LARGE;
      } else if (totalNumTickers > 1 && totalNumTickers <= 4) {
        return SizeMap.MEDIUM;
      } else if (totalNumTickers > 4 && totalNumTickers <= 6) {
        return SizeMap.SMALL;
      } else {
        return SizeMap.XSMALL;
      }
    }
  },
  actions: {
    bindEvents() {
      socket.on('cryptoUpdate', (msg: cryptoSocketData) => {
        console.log('crypto Update');
        console.log(msg);
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
        this.setExtStatus('CONNECTED', 'CRYPTO');
      });

      socket.on('stockUpdate', (msg: stockSocketData) => {
        const prevRes = this.stockValue(msg.symbol);
        const stock = {
          id: msg.symbol,
          curPrice: msg.price,
          volume: msg.volume,
          prevPrice: prevRes.curPrice,
          dayPercentage: msg.changesPercentage,
          dirFilter: priceDirection(prevRes.dirFilter, msg.price, prevRes.prevPrice),
          status: 'CONNECTED',
          type: 'STOCK'
        } as TickerData;
        this.updateStockData(msg.symbol, stock);
        this.setExtStatus('CONNECTED', 'STOCK');
      });

      socket.on('updateTickers', (msg: { crypto: string[]; stock: string[] }) => {
        for (const ticker of msg.crypto) {
          this.addNewTicker(ticker, 'CRYPTO');
        }
        for (const ticker of msg.stock) {
          this.addNewTicker(ticker, 'STOCK');
        }
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
