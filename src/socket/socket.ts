import { useTickerStore } from '@/store/ticker';
import { type StatusType, type TickerData } from '@/types/types';
import { priceDirection, concatVol } from '@/helpers/helpers';
import { CRYPTO_ENDPOINT } from '@/defaults/defaults';

export function websocketConnect() {
  const tickerStore = useTickerStore();
  tickerStore.setSocketStatus('CONNECTING' as StatusType);
  const socket = new WebSocket(CRYPTO_ENDPOINT);
  console.log('Socket Created!');

  socket.onopen = () => {
    socket.send(
      JSON.stringify({
        type: 'subscribe',
        product_ids: tickerStore.cryptoTickers,
        channels: [
          'heartbeat',
          {
            name: 'ticker',
            product_ids: tickerStore.cryptoTickers
          }
        ]
      })
    );
    tickerStore.setSocketStatus('CONNECTED');
  };

  socket.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg['type'] == 'ticker') {
      const prevRes = tickerStore.tickerValue(msg['product_id']);
      const tickerValue = {
        id: msg['product_id'],
        curPrice: parseFloat(msg['price']),
        volume: concatVol(parseInt(msg['volume_24h'])),
        prevPrice: prevRes.curPrice,
        dirFilter: priceDirection(prevRes.dirFilter, msg['price'], prevRes.prevPrice),
        status: 'CONNECTED'
      } as TickerData;
      tickerStore.updateTickerData(msg['product_id'], tickerValue);
    }
  };

  socket.onclose = (e) => {
    console.log(e);
    setTimeout(() => {
      tickerStore.setSocketStatus('CONNECTING');
      websocketConnect(); // Reconnect
    }, 60000);
  };

  socket.onerror = (err) => {
    console.log(err);
    tickerStore.setSocketStatus('ERROR');
    socket.close();
  };
}
