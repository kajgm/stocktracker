<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { type StatusType, type TickerType } from '@/types/types';
import Grid from './views/Grid.vue';
import axios from 'axios';

// Limited to 250 requests per day
// (24hr * 60min * 60sec * 1000ms) / 250 requests
// Called every ~5.5min, rounded up to account for testing/error
const API_TIMEOUT = 346000;

const cryptoURL = 'wss://ws-feed.exchange.coinbase.com';
const stockURL = 'https://financialmodelingprep.com/api/v3/quote/';

const cryptoTickers = ['ETH-USD', 'BTC-USD'] as string[];
const stockTickers = ['AAPL', 'MSFT'] as string[];

const defaultTicker = { prevPrice: '0', dirFilter: 'greenFilter', status: 'connecting' } as TickerType;

const sktStatus = ref('connecting' as StatusType);
const tickerResponse = reactive(
  new Map<string, TickerType>(cryptoTickers.concat(stockTickers).map((e) => [e, defaultTicker]))
);

function priceDirection(currentdirection: string, currentPrice: string, previousPrice: string) {
  if (previousPrice > currentPrice) {
    return 'redFilter';
  } else if (previousPrice < currentPrice) {
    return 'greenFilter';
  }

  return currentdirection;
}

const cryptoSubMsg = {
  type: 'subscribe',
  product_ids: cryptoTickers,
  channels: [
    'heartbeat',
    {
      name: 'ticker',
      product_ids: cryptoTickers
    }
  ]
};

const cryptoMsgFn = (e: MessageEvent<any>) => {
  sktStatus.value = 'connected';

  const msg = JSON.parse(e.data);
  if (msg['type'] == 'ticker') {
    const prevRes = tickerResponse.get(msg['product_id']) || defaultTicker;
    const tickerValue = {
      id: msg['product_id'],
      curPrice: msg['price'],
      volume: msg['volume_24h'].split('.')[0],
      prevPrice: prevRes.curPrice,
      dirFilter: priceDirection(prevRes.dirFilter, prevRes.curPrice, prevRes.prevPrice),
      status: 'connected'
    } as TickerType;
    tickerResponse.set(msg['product_id'], tickerValue);
  }
};

function websocketConnect(endpoint: string, subMsg: any, msgFn: (e: MessageEvent<any>) => void, loginMsg?: any) {
  sktStatus.value = 'connecting';
  const socket = new WebSocket(endpoint);

  socket.onopen = () => {
    if (loginMsg) {
      console.log(import.meta.env.VITE_VUE_APP_FMP_KEY);
      socket.send(JSON.stringify(loginMsg));
      console.log('logged in');
    }
    socket.send(JSON.stringify(subMsg));
  };

  socket.onmessage = msgFn;

  socket.onclose = (e) => {
    console.log(e);
    setTimeout(() => {
      sktStatus.value = 'connecting';
      websocketConnect(endpoint, subMsg, msgFn); // Reconnect
    }, 60000);
  };

  socket.onerror = (err) => {
    console.log(err);
    sktStatus.value = 'error';
    socket.close();
  };
}

function restApiPoll() {
  // axios
  //   .get(stockURL + stockTickers.toString() + '?apikey=' + import.meta.env.VITE_VUE_APP_FMP_KEY)
  //   .then((res) => {
  //     for (let i = 0; i < res.data.length; i++) {
  //     const prevRes = tickerResponse.get(res.data[i].symbol) || defaultTicker;
  //       const stock = {
  //         id: res.data[i].symbol,
  //         curPrice: res.data[i].price,
  //         volume: res.data[i].volume,
  //         prevPrice: prevRes.curPrice,
  //         dirFilter: priceDirection(prevRes.dirFilter, prevRes.curPrice, prevRes.prevPrice)
  //       } as TickerType;
  //       tickerResponse.set(res.data[i].symbol, stock);
  //     }
  //   })
  //   .catch((error) => {
  //     console.log(error);
  //   })
  //   .finally(() => {
  //     // need to add updates to the connecting status here
  //   });

  const res = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 195.9797,
      changesPercentage: 0.8385,
      change: 1.6297,
      dayLow: 194.88,
      dayHigh: 196.9,
      yearHigh: 199.62,
      yearLow: 164.08,
      marketCap: 3005172317770,
      priceAvg50: 178.0664,
      priceAvg200: 181.4276,
      exchange: 'NASDAQ',
      volume: '28673753',
      avgVolume: 61275561,
      open: 195.4,
      previousClose: 194.35,
      eps: 6.43,
      pe: 30.48,
      earningsAnnouncement: '2024-08-01T10:59:00.000+0000',
      sharesOutstanding: 15334100000,
      timestamp: 1717608650
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: '422.86',
      changesPercentage: 1.6319,
      change: 6.79,
      dayLow: 416.3,
      dayHigh: 423.35,
      yearHigh: 433.6,
      yearLow: 309.45,
      marketCap: 3142826606600,
      priceAvg50: 415.8776,
      priceAvg200: 379.92606,
      exchange: 'NASDAQ',
      volume: '7661534',
      avgVolume: 19836049,
      open: 417.81,
      previousClose: 416.07,
      eps: 11.53,
      pe: 36.67,
      earningsAnnouncement: '2024-07-23T10:59:00.000+0000',
      sharesOutstanding: 7432310000,
      timestamp: 1717608651
    }
  ];

  for (let i = 0; i < res.length; i++) {
    const prevRes = tickerResponse.get(res[i].symbol) || defaultTicker;
    const stock = {
      id: res[i].symbol,
      curPrice: res[i].price.toLocaleString('en', { minimumFractionDigits: 2 }),
      volume: res[i].volume,
      prevPrice: prevRes.curPrice,
      dirFilter: priceDirection(prevRes.dirFilter, prevRes.curPrice, prevRes.prevPrice),
      status: 'connected'
    } as TickerType;
    tickerResponse.set(res[i].symbol, stock);
  }

  console.log('called api!');
  setTimeout(restApiPoll, API_TIMEOUT);
}

onMounted(() => {
  websocketConnect(cryptoURL, cryptoSubMsg, cryptoMsgFn);
  restApiPoll();
});
</script>

<template>
  <Grid :tickerData="tickerResponse" :socketStatus="sktStatus" />
</template>

<style scoped>
header {
  line-height: 1.5;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
