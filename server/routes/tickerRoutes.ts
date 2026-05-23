import { Router } from 'express';
import { cbSocket } from '../server.js';
import { CryptoDB } from '../models/Crypto.js';
import { StockDB } from '../models/Stock.js';
import { ConfigDB } from '../models/Config.js';
import { queryApi } from '../config/dataApi.js';
import { DB_USER } from '../server.js';

const router = Router();

router.all('/get/tickers', async (req, res) => {
  try {
    let stocks: string[];
    let cryptos: string[];

    const expStock = req.app.get('stockTickers');
    const expCrypto = req.app.get('cryptoTickers');

    if (!expStock && !expCrypto && process.env.DB && process.env.DB == 'true') {
      const userConfig = (await ConfigDB.findOne({ user: DB_USER }).lean()) || { stockTickers: [], cryptoTickers: [] };
      stocks = userConfig.stockTickers;
      cryptos = userConfig.cryptoTickers;
    } else {
      stocks = expStock ? expStock.split(',') : undefined;
      cryptos = expCrypto ? expCrypto.split(',') : undefined;
    }

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.json({ stockTickers: stocks.toString(), cryptoTickers: cryptos.toString() });
  } catch (e) {
    console.log(e);
  }
});

router.all('/set/tickers', async (req, res) => {
  try {
    const stockTickers = req.query.stock as string;
    const cryptoTickers = req.query.crypto as string;

    let resString = '';
    let cryptoArr: string[] = [];
    let stockArr: string[] = [];

    if (cryptoTickers != undefined) {
      if (process.env.DB && process.env.DB == 'true') {
        cryptoArr = cryptoTickers.split(',');
      }
      req.app.set('cryptoTickers', cryptoTickers);
      resString += `updated crypto tickers to be ${cryptoTickers}`;
    }

    if (stockTickers != undefined) {
      if (process.env.DB && process.env.DB == 'true') {
        stockArr = stockTickers.split(',');
      }
      req.app.set('stockTickers', stockTickers);
      resString += `updated stock tickers to be ${stockTickers}`;
    }

    if (process.env.DB && process.env.DB == 'true') {
      const filter = { user: DB_USER };
      const update = { stockTickers: stockArr, cryptoTickers: cryptoArr };
      const options = { upsert: true }; // upsert if entry not found
      await ConfigDB.findOneAndUpdate(filter, update, options);
    }

    if (process.env.DB && process.env.DB == 'true') {
      if (cryptoTickers != undefined) {
        cbSocket.close();
      }

      if (stockTickers != undefined) {
        queryApi();
      }
    }

    res.send(resString);
  } catch (e) {
    console.log(e);
  }
});

router.all('/cleardb', async (_req, _res) => {
  if (process.env.DB && process.env.DB == 'true') {
    await CryptoDB.deleteMany({});
    await StockDB.deleteMany({});
    await ConfigDB.deleteMany({});
  }
});

export default router;
