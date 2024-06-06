import { type Ref } from 'vue';
import { type TickerType, type StatusType } from '@/types/types';
import { CRYPTO_TICKERS, CRYPTO_ENDPOINT, DEFAULT_TICKER } from '@/defaults/defaults';
import { priceDirection } from '@/helpers/helpers';

export function websocketConnect(sktStatus: Ref<StatusType>, tickerResponse: Map<string, TickerType>) {
  sktStatus.value = 'CONNECTING';
  const socket = new WebSocket(CRYPTO_ENDPOINT);

  socket.onopen = () => {
    socket.send(
      JSON.stringify({
        type: 'subscribe',
        product_ids: CRYPTO_TICKERS,
        channels: [
          'heartbeat',
          {
            name: 'ticker',
            product_ids: CRYPTO_TICKERS
          }
        ]
      })
    );
  };

  socket.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg['type'] == 'ticker') {
      const prevRes = tickerResponse.get(msg['product_id']) || DEFAULT_TICKER;
      const tickerValue = {
        id: msg['product_id'],
        curPrice: parseFloat(msg['price']),
        volume: parseInt(msg['volume_24h'].split('.')[0]),
        prevPrice: prevRes.curPrice,
        dirFilter: priceDirection(prevRes.dirFilter, msg['price'], prevRes.prevPrice),
        status: 'CONNECTED'
      } as TickerType;
      tickerResponse.set(msg['product_id'], tickerValue);
    }
  };

  socket.onclose = (e) => {
    console.log(e);
    setTimeout(() => {
      sktStatus.value = 'CONNECTING';
      websocketConnect(sktStatus, tickerResponse); // Reconnect
    }, 60000);
  };

  socket.onerror = (err) => {
    console.log(err);
    sktStatus.value = 'ERROR';
    socket.close();
  };
}
