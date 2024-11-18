import { Router } from 'express';
import { socket } from '../server.js';
import { Crypto } from '../models/Crypto.js';
import { Stock } from '../models/Stock.js';
import { getTrackedTickers } from '../helpers/helpers.js';

const router = Router();

router.all('/get/tickers', async (_req, res) => {
  try {
    const { stockTickers, cryptoTickers } = await getTrackedTickers();

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.json({ stockTickers: stockTickers.toString(), cryptoTickers: cryptoTickers.toString() });
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
          await Crypto.create({ product_id: ticker });
        }
      }
      req.app.set('cryptoTickers', cryptoTickers);
      if (process.env.SERVER_QUERYING) {
        socket.close();
      }
      resString += `updated crypto tickers to be ${cryptoTickers}`;
    }

    if (stockTickers != undefined) {
      if (process.env.DB) {
        await Stock.deleteMany({});
        const tickerArr = stockTickers.split(',');
        for (const ticker of tickerArr) {
          await Stock.create({ symbol: ticker });
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
