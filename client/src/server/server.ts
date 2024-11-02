import axios from 'axios';
import { useTickerStore } from '@/store/ticker.js';
import { coinbaseConnect } from '@/crypto/crypto.js';

const SERVER_TIMEOUT = 1000;
const SERVER_ENDPOINT = 'http://localhost:3000/api/get/tickers';

export function getUpdatedTickers() {
  const tickerStore = useTickerStore();
  let cryptoUpdatedFlag = false;
  let stockUpdatedFlag = false;
  axios
    .get(SERVER_ENDPOINT)
    .then((res) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const cryptoTcks = res.data['cryptoTickers'] as string;
      if (
        cryptoTcks &&
        tickerStore.cryptoStatus != 'UPDATED' &&
        cryptoTcks.split(',').toString() != tickerStore.cryptoKeys.toString()
      ) {
        cryptoUpdatedFlag = true;
        tickerStore.clearCryptoTickers();
        for (const ticker of cryptoTcks.split(',')) {
          tickerStore.addNewTicker(ticker, 'CRYPTO');
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const stockTcks = res.data['stockTickers'] as string;
      if (
        stockTcks &&
        tickerStore.stockStatus != 'UPDATED' &&
        stockTcks.split(',').toString() != tickerStore.stockKeys.toString()
      ) {
        stockUpdatedFlag = true;
        tickerStore.clearStockTickers();
        for (const ticker of stockTcks.split(',')) {
          tickerStore.addNewTicker(ticker, 'STOCK');
        }
      }
    })
    .catch((err) => {
      console.log('Failed to contact server!', err);
    })
    .finally(() => {
      if (cryptoUpdatedFlag) {
        tickerStore.setExtStatus('UPDATED', 'CRYPTO');
      }
      if (stockUpdatedFlag) {
        tickerStore.setExtStatus('UPDATED', 'STOCK');
      }
    });
}

export function pollUpdatedTickers() {
  const tickerStore = useTickerStore();
  getUpdatedTickers();

  if (tickerStore.cryptoSocket && tickerStore.cryptoStatus == 'UPDATED') {
    tickerStore.cryptoSocket.close();
    const newSocket = coinbaseConnect();
    tickerStore.setSocket(newSocket);
  }

  setTimeout(pollUpdatedTickers, SERVER_TIMEOUT);
}
