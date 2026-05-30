import { config } from 'dotenv';
config();

import axios from 'axios';
import { Request } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { StockDB } from '../models/Stock.js';
import { ConfigDB } from '../models/Config.js';

// Limited to 250 requests per day
// Standard trading day is open 6.5 hours
// (6.5hr * 60min * 60sec * 1000ms) / 250 requests
// Called every ~1.7min, rounded up to account for testing/error
// Can change this later to ~93600
import { STOCK_TIMEOUT, DB_USER } from '../server.js';

const STOCK_ENDPOINT = process.env.STOCK_ENDPOINT || 'https://financialmodelingprep.com/stable/quote?symbol=';
const OPEN_HOURS = 570; // 9 * 60 + 30
const CLOSE_HOURS = 960; // 16 * 60

export async function queryApi(req?: Request<{}, any, any, ParsedQs, Record<string, any>>) {
  let stockTickers: string[] = [];

  // If using express server only, get tickers from express
  if (req) {
    stockTickers = req.app.get('stockTickers') ? req.app.get('stockTickers').split(',') : [];
    // Otherwise, get tickers from DB
  } else {
    const userConfig = (await ConfigDB.findOne({ user: DB_USER }).lean()) || { cryptoTickers: [], stockTickers: [] };
    stockTickers = userConfig.stockTickers;
  }

  if (stockTickers.length > 0) {
    console.log(`Calling FMP api with ticker: ${stockTickers[0]}`);
    axios
      .get(STOCK_ENDPOINT + stockTickers[0].toString() + '&apikey=' + process.env.FMP_KEY)
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

// req is undefined when DB is enabled
export function pollApi(req?: Request<{}, any, any, ParsedQs, Record<string, any>>) {
  const date = new Date();
  const currentTime = (date.getUTCHours() - 4) * 60 + date.getUTCMinutes();
  const isWeekday = date.getDay() % 6 != 0;
  if (OPEN_HOURS <= currentTime && currentTime <= CLOSE_HOURS && isWeekday) {
    queryApi(req);
  } else {
    console.log('Skipped api call, outside trading hours');
  }

  return req == undefined
    ? setTimeout(() => pollApi(), STOCK_TIMEOUT)
    : setTimeout(() => req.app.set('pollId', pollApi(req)), STOCK_TIMEOUT);
}
