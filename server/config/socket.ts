import { Crypto } from '../models/Crypto';
import { getTrackedTickers } from 'helpers/helpers';
import type { Express } from 'express';
import type { WebsocketData } from '../../common/types/types';

const CRYPTO_ENDPOINT = process.env.CRYPTO_ENDPOINT || 'wss://ws-feed.exchange.coinbase.com';

export function createDataSocket(app: Express, tickers: string) {
  const socket = new WebSocket(CRYPTO_ENDPOINT);
  console.log('Socket Created!');
  socket.onopen = () => {
    socket.send(
      JSON.stringify({
        type: 'subscribe',
        product_ids: tickers,
        channels: [
          'heartbeat',
          {
            name: 'ticker',
            product_ids: tickers
          }
        ]
      })
    );
  };

  socket.onmessage = async (e: MessageEvent<unknown>) => {
    const msg = JSON.parse(e.data as string) as WebsocketData;
    if (msg['type'] === 'ticker') {
      const query = {};
      const update = { msg };
      const options = { upsert: true, new: true };
      await Crypto.findOneAndUpdate(query, update, options);
    }
  };

  socket.onclose = (e) => {
    console.log(e);
    console.log('Socket closing, opening new socket');
    setTimeout(async () => {
      const { crypto } = await getTrackedTickers(app);
      createDataSocket(app, crypto);
    }, 10000);
  };

  socket.onerror = (err) => {
    console.log(err);
    socket.close();
  };
}
