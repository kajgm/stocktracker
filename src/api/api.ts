import axios from 'axios';
import { type Ref } from 'vue';
import { type StatusType, type TickerType } from '@/types/types';
import { API_TIMEOUT, DEFAULT_TICKER, STOCK_ENDPOINT, STOCK_TICKERS } from '@/defaults/defaults';
import { priceDirection } from '@/helpers/helpers';

const openHours = 9 * 60 + 30;
const closeHours = 16 * 60;

export function restApiPoll(apiStatus: Ref<StatusType>, tickerResponse: Map<string, TickerType>) {
  const date = new Date();
  const currentTime = (date.getUTCHours() - 4) * 60 + date.getUTCMinutes();

  if ((openHours <= currentTime && currentTime <= closeHours) || apiStatus.value != 'CONNECTED') {
    axios
      .get(STOCK_ENDPOINT + STOCK_TICKERS.toString() + '?apikey=' + import.meta.env.VITE_VUE_APP_FMP_KEY)
      .then((res) => {
        for (let i = 0; i < res.data.length; i++) {
          const prevRes = tickerResponse.get(res.data[i].symbol) || DEFAULT_TICKER;
          const stock = {
            id: res.data[i].symbol,
            curPrice: parseFloat(res.data[i].price),
            volume: parseInt(res.data[i].volume),
            prevPrice: prevRes.curPrice,
            dirFilter: priceDirection(prevRes.dirFilter, res.data[i].price, prevRes.prevPrice),
            status: 'CONNECTED'
          } as TickerType;
          tickerResponse.set(res.data[i].symbol, stock);
        }
      })
      .catch((error) => {
        console.log(error);
        apiStatus.value = 'ERROR';
      })
      .finally(() => {
        apiStatus.value = 'CONNECTED';
      });
    console.log('Called FMP api');
  } else {
    console.log('Skipped api call, outside trading hours');
  }

  setTimeout(restApiPoll, API_TIMEOUT);
}
