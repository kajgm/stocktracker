import axios from 'axios';
import { type ApiRequestData, type TickerData } from '@/types/types.js';
import { useTickerStore } from '@/store/ticker.js';
import { priceDirection } from '@/helpers/helpers.js';

// Limited to 250 requests per day
// Standard trading day is open 6.5 hours
// (6.5hr * 60min * 60sec * 1000ms) / 250 requests
// Called every ~1.7min, rounded up to account for testing/error
// Can change this later to ~93600
const API_TIMEOUT = 100000;

const STOCK_ENDPOINT = 'https://financialmodelingprep.com/api/v3/quote/';

const openHours = 570; // 9 * 60 + 30
const closeHours = 960; // 16 * 60

export function fmpQuery() {
  const tickerStore = useTickerStore();
  const date = new Date();
  const currentTime = (date.getUTCHours() - 4) * 60 + date.getUTCMinutes();
  const isWeekday = date.getDay() % 6 != 0;

  if (
    ((openHours <= currentTime && currentTime <= closeHours && isWeekday) || tickerStore.stockStatus == 'UPDATED') &&
    tickerStore.stockKeys.length > 0
  ) {
    axios
      .get(STOCK_ENDPOINT + tickerStore.stockKeys.toString() + '?apikey=' + process.env.FMP_KEY)
      .then((res) => {
        for (const ticker of res.data) {
          const apiTicker = ticker as ApiRequestData;
          const prevRes = tickerStore.stockValue(apiTicker.symbol);
          const stock = {
            id: apiTicker.symbol,
            curPrice: apiTicker.price,
            volume: apiTicker.volume,
            prevPrice: prevRes.curPrice,
            dayPercentage: apiTicker.changesPercentage,
            dirFilter:
              prevRes.curPrice == -1
                ? priceDirection(prevRes.dirFilter, apiTicker.changesPercentage, 0)
                : priceDirection(prevRes.dirFilter, apiTicker.price, prevRes.prevPrice),
            status: 'CONNECTED',
            type: 'STOCK'
          } as TickerData;
          tickerStore.updateStockData(apiTicker.symbol, stock);
        }
      })
      .catch((error) => {
        console.log(error);
        tickerStore.setExtStatus('ERROR', 'STOCK');
      })
      .finally(() => {
        tickerStore.setExtStatus('CONNECTED', 'STOCK');
      });
    console.log('Called FMP api');
  } else {
    console.log('Skipped api call, outside trading hours or no stocks provided');
  }
}

export function fmpConnect() {
  fmpQuery();
  setTimeout(fmpConnect, API_TIMEOUT);
}
