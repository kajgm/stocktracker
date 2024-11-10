import { Crypto } from '../models/Crypto';
import { Stock } from '../models/Stock';

export async function getTrackedTickers(app: any) {
  let stock = app.get('stockTickers');
  let crypto = app.get('cryptoTickers');

  if (!stock && !crypto && process.env.DB) {
    console.log('Did not find any set tickers in express, querying mongodb');
    stock = (await Stock.find()).map((ticker) => ticker.id).toString();
    crypto = (await Crypto.find()).map((ticker) => ticker.id).toString();
  }

  return { stock: stock, crypto: crypto };
}
