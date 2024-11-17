import axios from 'axios';
import { Stock } from '../models/Stock.js';
import { getTrackedTickers } from '../helpers/helpers.js';

const openHours = 570; // 9 * 60 + 30
const closeHours = 960; // 16 * 60

async function queryApi(endpoint: string) {
  const date = new Date();
  const currentTime = (date.getUTCHours() - 4) * 60 + date.getUTCMinutes();
  const isWeekday = date.getDay() % 6 != 0;
  const { stockTickers } = await getTrackedTickers();

  if (openHours <= currentTime && currentTime <= closeHours && isWeekday && stockTickers.length > 0) {
    console.log('Calling FMP api...');
    axios
      .get(endpoint + stockTickers.toString() + '?apikey=' + process.env.FMP_KEY)
      .then(async (res) => {
        for (const ticker of res.data) {
          const filter = { symbol: ticker.symbol };
          const update = { ...ticker };
          const options = { upsert: true };
          await Stock.findOneAndUpdate(filter, update, options);
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        console.log('Called FMP api');
      });
  } else {
    console.log('Skipped api call, outside trading hours or no stocks provided');
  }
}

function pollApi(endpoint: string, timeout: number) {
  queryApi(endpoint);
  setTimeout(queryApi, timeout, endpoint);
}

export default pollApi;
