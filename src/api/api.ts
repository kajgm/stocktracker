import axios from 'axios';
import { type TickerData } from '@/types/types';
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
          const prevRes = tickerStore.tickerValue(res.data[i].symbol);
          const stock = {
            id: res.data[i].symbol as string,
            curPrice: res.data[i].price as number,
            volume: res.data[i].volume as number,
            prevPrice: prevRes.curPrice,
            dirFilter: priceDirection(prevRes.dirFilter, res.data[i].price, prevRes.prevPrice),
            status: 'CONNECTED'
          } as TickerData;
          tickerStore.updateTickerData(res.data[i].symbol, stock);
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
