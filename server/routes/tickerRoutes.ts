import { Router } from 'express';
import { Crypto } from '../models/Crypto';
import { Stock } from '../models/Stock';
import { getTrackedTickers } from 'helpers/helpers';

const router = Router();

router.all('/get/tickers', async (req, res) => {
  try {
    const { stock, crypto } = await getTrackedTickers(req.app);

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
      if (process.env.DB) {
        await Crypto.deleteMany({});
        const tickerArr = cryptoTickers.split(',');
        for (const ticker of tickerArr) {
          console.log(ticker);
          await Crypto.create({ id: ticker });
        }
      }
      req.app.set('cryptoTickers', cryptoTickers);
      resString += `updated crypto tickers to be ${cryptoTickers}`;
    }

    if (stockTickers != undefined) {
      if (process.env.DB) {
        await Stock.deleteMany({});
        const tickerArr = stockTickers.split(',');
        for (const ticker of tickerArr) {
          await Stock.create({ id: ticker });
        }
      }
      req.app.set('stockTickers', stockTickers);
      resString += `updated stock tickers to be ${stockTickers}`;
    }

    res.send(resString);
  } catch (e) {
    console.log(e);
  }
});

export default router;
