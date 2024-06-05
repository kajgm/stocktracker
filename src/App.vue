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
  axios
    .get(stockURL + stockTickers.toString() + '?apikey=' + import.meta.env.VITE_VUE_APP_FMP_KEY)
    .then((res) => {
      for (let i = 0; i < res.data.length; i++) {
        const prevRes = tickerResponse.get(res.data[i].symbol) || defaultTicker;
        const stock = {
          id: res.data[i].symbol,
          curPrice: res.data[i].price.toLocaleString('en', { minimumFractionDigits: 2 }),
          volume: res.data[i].volume,
          prevPrice: prevRes.curPrice,
          dirFilter: priceDirection(prevRes.dirFilter, prevRes.curPrice, prevRes.prevPrice),
          status: 'connected'
        } as TickerType;
        tickerResponse.set(res.data[i].symbol, stock);
      }
    })
    .catch((error) => {
      console.log(error);
    });

  console.log('Called FMP api');
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
