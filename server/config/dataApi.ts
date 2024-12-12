import axios from 'axios';
import { StockDB } from '../models/Stock.js';
import { ConfigDB } from '../models/Config.js';
import { USER } from '../server.js';

// Limited to 250 requests per day
// Standard trading day is open 6.5 hours
// (6.5hr * 60min * 60sec * 1000ms) / 250 requests
// Called every ~1.7min, rounded up to account for testing/error
// Can change this later to ~93600
const STOCK_TIMEOUT = 100000;
const STOCK_ENDPOINT = process.env.STOCK_ENDPOINT || 'https://financialmodelingprep.com/api/v3/quote/';

const openHours = 570; // 9 * 60 + 30
const closeHours = 960; // 16 * 60

export async function queryApi() {
  const userConfig = (await ConfigDB.findOne({ user: USER }).lean()) || { cryptoTickers: [], stockTickers: [] };
  const stockTickers = userConfig.stockTickers;

  if (stockTickers.length > 0) {
    console.log(`Calling FMP api with tickers: ${stockTickers}`);
    axios
      .get(STOCK_ENDPOINT + stockTickers.toString() + '?apikey=' + process.env.FMP_KEY)
      .then(async (res) => {
        for (const ticker of res.data) {
          const filter = { symbol: ticker.symbol };
          const update = { ...ticker };
          const options = { upsert: true };
          await StockDB.findOneAndUpdate(filter, update, options);
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        console.log('Called FMP api');
      });
  } else {
    console.log('Skipped api call, no tickers provided');
  }
}

export function pollApi() {
  const date = new Date();
  const currentTime = (date.getUTCHours() - 4) * 60 + date.getUTCMinutes();
  const isWeekday = date.getDay() % 6 != 0;
  if (openHours <= currentTime && currentTime <= closeHours && isWeekday) {
    queryApi();
  } else {
    console.log('Skipped api call, outside trading hours');
  }
  setTimeout(pollApi, STOCK_TIMEOUT);
}
