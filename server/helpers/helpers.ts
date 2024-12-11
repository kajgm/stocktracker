import { app } from '../server.js';
import { Crypto } from '../models/Crypto.js';
import { Stock } from '../models/Stock.js';

export async function getTrackedTickers() {
  let stock: string[];
  let crypto: string[];

  const expStock = app.get('stockTickers');
  const expCrypto = app.get('cryptoTickers');

  if (!expStock && !expCrypto && process.env.DB) {
    stock = (await Stock.find()).map((ticker) => ticker.symbol);
    crypto = (await Crypto.find()).map((ticker) => ticker.product_id);
  } else {
    stock = expStock ? expStock.split(',') : undefined;
    crypto = expCrypto ? expCrypto.split(',') : undefined;
  }

  return { stockTickers: stock, cryptoTickers: crypto };
}

export async function getTrackedStockData() {
  return await Stock.find();
}

export async function getTrackedCryptoData() {
  return await Crypto.find();
}
