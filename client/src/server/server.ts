import axios from 'axios';
import { useTickerStore } from '@/store/ticker.js';
import { websocketConnect } from '@/socket/socket.js';

const SERVER_TIMEOUT = 1000;
const SERVER_ENDPOINT = 'http://localhost:3000/api/tickers';

export function getUpdatedTickers() {
  const tickerStore = useTickerStore();
  let updatedFlag = false;
  void axios
    .get(SERVER_ENDPOINT)
    .then((res) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const cryptoTcks = res.data['cryptoTickers'] as string;
      if (cryptoTcks && cryptoTcks.split(',').toString() != tickerStore.cryptoTickers.toString()) {
        updatedFlag = true;
        tickerStore.clearCryptoTickers();
        for (const ticker of cryptoTcks.split(',')) {
          tickerStore.addNewTicker(ticker, 'CRYPTO');
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const stockTcks = res.data['stockTickers'] as string;
      if (stockTcks && stockTcks.split(',').toString() != tickerStore.stockTickers.toString()) {
        updatedFlag = true;
        tickerStore.clearStockTickers();
        for (const ticker of stockTcks.split(',')) {
          tickerStore.addNewTicker(ticker, 'STOCK');
        }
      }
    })
    .catch((err) => {
      console.log('Failed to contact server!', err);
    });

  return updatedFlag;
}

export function pollUpdatedTickers(socket: WebSocket | undefined) {
  const isUpdated = getUpdatedTickers();
  if (isUpdated && socket) {
    socket.close();
    websocketConnect();
  }
  setTimeout(pollUpdatedTickers, SERVER_TIMEOUT);
}
