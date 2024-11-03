import { useTickerStore } from '@/store/ticker.js';
import { priceDirection } from '@/helpers/helpers.js';
import { type TickerData, type WebsocketData } from '@/types/types.js';

const CRYPTO_ENDPOINT = 'wss://ws-feed.exchange.coinbase.com';

export function coinbaseConnect() {
  const tickerStore = useTickerStore();
  tickerStore.setExtStatus('CONNECTING', 'CRYPTO');
  const socket = new WebSocket(CRYPTO_ENDPOINT);
  console.log('Socket Created!');
  socket.onopen = () => {
    socket.send(
      JSON.stringify({
        type: 'subscribe',
        product_ids: tickerStore.cryptoKeys,
        channels: [
          'heartbeat',
          {
            name: 'ticker',
            product_ids: tickerStore.cryptoKeys
          }
        ]
      })
    );
    tickerStore.setExtStatus('CONNECTED', 'CRYPTO');
  };

  socket.onmessage = (e: MessageEvent<unknown>) => {
    const msg = JSON.parse(e.data as string) as WebsocketData;
    if (msg['type'] == 'ticker') {
      const prevRes = tickerStore.cryptoValue(msg.product_id);
      const curPrice = parseFloat(msg.price);
      const dayPrice = parseFloat(msg.open_24h);
      const tickerValue = {
        id: msg.product_id,
        curPrice: curPrice,
        volume: parseFloat(msg.volume_24h),
        dayPercentage: ((curPrice - dayPrice) / dayPrice) * 100,
        prevPrice: prevRes.curPrice,
        dirFilter: priceDirection(prevRes.dirFilter, curPrice, prevRes.prevPrice),
        status: 'CONNECTED',
        type: 'CRYPTO'
      } as TickerData;
      tickerStore.updateCryptoData(msg.product_id, tickerValue);
    }
  };

  socket.onclose = (e) => {
    console.log(e);
  };

  socket.onerror = (err) => {
    console.log(err);
    tickerStore.setExtStatus('ERROR', 'CRYPTO');
    socket.close();
  };

  return socket;
}
