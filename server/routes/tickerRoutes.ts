import { Router } from 'express';
import { cbSocket } from '../server.js';
import { CryptoDB } from '../models/Crypto.js';
import { StockDB } from '../models/Stock.js';
import { ConfigDB } from '../models/Config.js';
import { pollApi, queryApi } from '../config/dataApi.js';
import { DB_USER } from '../server.js';

const router = Router();

router.all('/get/tickers', async (req, res) => {
  try {
    let stocks: string[];
    let cryptos: string[];

    const expressStockArr = req.app.get('stockTickers');
    const expressCryptoArr = req.app.get('cryptoTickers');

    // If DB is enabled, use DB values
    if (!expressStockArr && !expressCryptoArr && process.env.DB && process.env.DB == 'true') {
      const userConfig = (await ConfigDB.findOne({ user: DB_USER }).lean()) || { stockTickers: [], cryptoTickers: [] };
      stocks = userConfig.stockTickers;
      cryptos = userConfig.cryptoTickers;
      // Otherwise, use express values
    } else {
      stocks = expressStockArr ? expressStockArr.split(',') : undefined;
      cryptos = expressCryptoArr ? expressCryptoArr.split(',') : undefined;
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
    let cryptos: string[] = [];
    let stocks: string[] = [];

    if (cryptoTickers != undefined) {
      cryptos = cryptoTickers.split(',');
      req.app.set('cryptoTickers', cryptoTickers);
      resString += `updated crypto tickers to be ${cryptoTickers}`;
    }

    if (stockTickers != undefined) {
      stocks = stockTickers.split(',');
      req.app.set('stockTickers', stockTickers);
      resString += `updated stock tickers to be ${stockTickers}`;
    }

    if (process.env.DB && process.env.DB == 'true') {
      const filter = { user: DB_USER };
      const update = { stockTickers: stocks, cryptoTickers: cryptos };
      const options = { upsert: true }; // upsert if entry not found
      await ConfigDB.findOneAndUpdate(filter, update, options);
    }

    if (cryptoTickers != undefined) {
      cbSocket.close();
    }

    if (stockTickers != undefined) {
      if (process.env.DB && process.env.DB == 'true') {
        // Just immediate poll and update
        queryApi();
      } else {
        // Reset the poll query
        clearTimeout(req.app.get('pollId'));
        req.app.set('pollId', pollApi(req));
      }
    }

    res.send(resString);
  } catch (e) {
    console.log(e);
  }
});

router.all('/cleardb', async (_req, res) => {
  let msg = '';
  if (process.env.DB && process.env.DB == 'true') {
    await CryptoDB.deleteMany({});
    await StockDB.deleteMany({});
    await ConfigDB.deleteMany({});
    msg = 'DB Cleared';
  } else {
    msg = 'DB not enabled';
  }

  res.send(msg);
});

export default router;
