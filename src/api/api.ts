import axios from 'axios';
import { type ApiRequestData, type TickerData } from '@/types/types';
import { useTickerStore } from '@/store/ticker';
import { priceDirection } from '@/helpers/helpers';
import { API_TIMEOUT, STOCK_ENDPOINT } from '@/defaults/defaults';

const openHours = 9 * 60 + 30;
const closeHours = 16 * 60;

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
