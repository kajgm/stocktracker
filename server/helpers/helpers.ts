import { app } from '../server.js';
import { Crypto } from '../models/Crypto.js';
import { Stock } from '../models/Stock.js';

export async function getTrackedTickers() {
  let stock = app.get('stockTickers');
  let crypto = app.get('cryptoTickers');

  if (!stock && !crypto && process.env.DB) {
    console.log('Did not find any set tickers in express, querying mongodb');
    stock = (await Stock.find()).map((ticker) => ticker.symbol);
    crypto = (await Crypto.find()).map((ticker) => ticker.product_id);
  }

  return { stockTickers: stock, cryptoTickers: crypto };
}
