import { Crypto } from '../models/Crypto.js';
import { getTrackedTickers } from '../helpers/helpers.js';
import type { WebsocketData } from '../../common/types/types.js';

async function createDataSocket(endpoint: string) {
  const { cryptoTickers } = await getTrackedTickers();
  if (cryptoTickers === '') {
    console.log('No tickers found, skipping socket creation');
    return;
  }
  const socket = new WebSocket(endpoint);
  console.log(`Socket Created with tickers: ${cryptoTickers}`);
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
    }
  };

  socket.onclose = (e) => {
    console.log(e);
    console.log('Socket closing, opening new socket');
    setTimeout(() => {
      createDataSocket(endpoint);
    }, 10000);
  };

  socket.onerror = (err) => {
    console.log(err);
    socket.close();
  };

  return socket;
}

export default createDataSocket;
