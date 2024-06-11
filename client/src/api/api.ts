import axios from 'axios';
import { type ApiRequestData, type TickerData } from '@/types/types';
import { useTickerStore } from '@/store/ticker';
import { priceDirection } from '@/helpers/helpers';

// Limited to 250 requests per day
// Standard trading day is open 6.5 hours
// (6.5hr * 60min * 60sec * 1000ms) / 250 requests
// Called every ~1.7min, rounded up to account for testing/error
// Can change this later to ~93600
const API_TIMEOUT = 100000;

const STOCK_ENDPOINT = 'https://financialmodelingprep.com/api/v3/quote/';

const openHours = 570; // 9 * 60 + 30
const closeHours = 960; // 16 * 60

export function restApiPoll() {
  const tickerStore = useTickerStore();
  const date = new Date();
  const currentTime = (date.getUTCHours() - 4) * 60 + date.getUTCMinutes();
  const isWeekday = date.getDay() % 6 != 0;

  if ((openHours <= currentTime && currentTime <= closeHours && isWeekday) || tickerStore.apiStatus != 'CONNECTED') {
    axios
      .get(STOCK_ENDPOINT + tickerStore.stockTickers.toString() + '?apikey=' + import.meta.env.VITE_VUE_APP_FMP_KEY)
      .then((res) => {
        for (let i = 0; i < res.data.length; i++) {
          const apiTicker = res.data[i] as ApiRequestData;
          const prevRes = tickerStore.tickerValue(apiTicker.symbol);
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
            status: 'CONNECTED'
          } as TickerData;
          tickerStore.updateTickerData(apiTicker.symbol, stock);
        }
      })
      .catch((error) => {
        console.log(error);
        tickerStore.setApiStatus('ERROR');
      })
      .finally(() => {
        tickerStore.setApiStatus('CONNECTED');
      });
    console.log('Called FMP api');
  } else {
    console.log('Skipped api call, outside trading hours');
  }

  setTimeout(restApiPoll, API_TIMEOUT);
}
