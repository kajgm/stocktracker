import { Router } from 'express';
import { Cryptos, Stocks } from '../models/Tickers';

const router = Router();

router.all('/get/tickers', async (req, res) => {
  try {
    let stock = req.app.get('stockTickers');
    let crypto = req.app.get('cryptoTickers');

    if (!stock && !crypto) {
      console.log('Did not find any set tickers in express, querying mongodb');
      stock = (await Stocks.find()).map((ticker) => ticker.stock).toString();
      crypto = (await Cryptos.find()).map((ticker) => ticker.crypto).toString();
    }

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.json({ stockTickers: stock, cryptoTickers: crypto });
  } catch (e) {
    console.log(e);
  }
});

router.all('/set/tickers', async (req, res) => {
  try {
    const stockTickers = req.query.stock as string;
    const cryptoTickers = req.query.crypto as string;

    let resString = '';

    if (cryptoTickers != undefined) {
      await Cryptos.deleteMany({});
      req.app.set('cryptoTickers', cryptoTickers);
      const tickerArr = cryptoTickers.split(',');
      for (const ticker of tickerArr) {
        console.log(ticker);
        await Cryptos.create({ crypto: ticker });
      }
      resString += `updated crypto tickers to be ${cryptoTickers}`;
    }

    if (stockTickers != undefined) {
      await Stocks.deleteMany({});
      req.app.set('stockTickers', stockTickers);
      const tickerArr = stockTickers.split(',');
      for (const ticker of tickerArr) {
        await Stocks.create({ stock: ticker });
      }
      resString += `updated stock tickers to be ${stockTickers}`;
    }

    res.send(resString);
  } catch (e) {
    console.log(e);
  }
});

export default router;
