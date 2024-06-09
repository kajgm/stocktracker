import { useTickerStore } from '@/store/ticker';
import { type StatusType, type TickerData, type WebsocketData } from '@/types/types';
import { priceDirection } from '@/helpers/helpers';
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
      const socketTicker = msg as WebsocketData;
      const prevRes = tickerStore.tickerValue(socketTicker.product_id);
      const tickerValue = {
        id: socketTicker.product_id,
        curPrice: parseFloat(socketTicker.price),
        volume: parseFloat(socketTicker.volume_24h),
        dayPercentage: parseFloat(socketTicker.price) / parseFloat(socketTicker.open_24h),
        prevPrice: prevRes.curPrice,
        dirFilter: priceDirection(prevRes.dirFilter, parseFloat(socketTicker.price), prevRes.prevPrice),
        status: 'CONNECTED'
      } as TickerData;
      tickerStore.updateTickerData(socketTicker.product_id, tickerValue);
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
