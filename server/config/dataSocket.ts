import { Crypto } from '../models/Crypto.js';
import { getTrackedTickers } from '../helpers/helpers.js';
import type { WebsocketData } from '../../common/types/types.js';

const CRYPTO_ENDPOINT = process.env.CRYPTO_ENDPOINT || 'wss://ws-feed.exchange.coinbase.com';

async function createDataSocket() {
  const { cryptoTickers } = await getTrackedTickers();
  if (cryptoTickers.length == 0) {
    return new WebSocket('');
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
      const options = { upsert: true };
      await Crypto.findOneAndUpdate(filter, update, options);
    } else if (msg['type'] === 'error') {
      socket.close();
    }
  };

  socket.onclose = (e) => {
    console.log(e);
    console.log('Socket closing, opening new socket');
    setTimeout(() => {
      createDataSocket();
    }, 10000);
  };

  socket.onerror = (err) => {
    console.log(err);
    socket.close();
  };

  console.log(`Socket Created with tickers: ${cryptoTickers}`);
  return socket;
}

export default createDataSocket;
