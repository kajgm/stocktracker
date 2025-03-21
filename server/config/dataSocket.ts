import type { WebsocketData } from '../../common/types/types.js';
import { CryptoDB } from '../models/Crypto.js';
import { ConfigDB } from '../models/Config.js';
import { CRYPTO_TIMEOUT, DB_USER } from '../server.js';

const CRYPTO_ENDPOINT = process.env.CRYPTO_ENDPOINT || 'wss://ws-feed.exchange.coinbase.com';

async function createDataSocket() {
  const userConfig = (await ConfigDB.findOne({ user: DB_USER }).lean()) || { cryptoTickers: [], stockTickers: [] };
  const cryptoTickers = userConfig.cryptoTickers;
  if (cryptoTickers.length == 0) {
    return {
      close: () => {
        console.log('Opening new socket');
        setTimeout(() => {
          createDataSocket();
        }, CRYPTO_TIMEOUT);
      }
    };
  }

  const socket = new WebSocket(CRYPTO_ENDPOINT);

  socket.onopen = () => {
    socket.send(
      JSON.stringify({
        type: 'subscribe',
        product_ids: cryptoTickers,
        channels: [
          'heartbeat',
          {
            name: 'ticker',
            product_ids: cryptoTickers
          }
        ]
      })
    );
  };

  socket.onmessage = async (e: MessageEvent<unknown>) => {
    const msg = JSON.parse(e.data as string) as WebsocketData;
    if (msg['type'] === 'ticker') {
      const filter = { product_id: msg['product_id'] };
      const update = { ...msg };
      const options = { upsert: true }; // upsert if entry not found
      await CryptoDB.findOneAndUpdate(filter, update, options);
    } else if (msg['type'] === 'error') {
      socket.close();
    }
  };

  socket.onclose = (e) => {
    console.log(e);
    console.log('Socket closing, opening new socket');
    setTimeout(() => {
      createDataSocket();
    }, CRYPTO_TIMEOUT);
  };

  socket.onerror = (err) => {
    console.log(err);
    socket.close();
  };

  console.log(`Socket Created with tickers: ${cryptoTickers}`);
  return socket;
}

export default createDataSocket;
