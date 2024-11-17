import { config } from 'dotenv';
config();

import express from 'express';
import morgan from 'morgan';
import tickerRoutes from './routes/tickerRoutes.js';
import connectDB from './config/db.js';
import pollApi from './config/api.js';
import createDataSocket from './config/socket.js';

const EXPRESS_PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stocktracker';

// Limited to 250 requests per day
// Standard trading day is open 6.5 hours
// (6.5hr * 60min * 60sec * 1000ms) / 250 requests
// Called every ~1.7min, rounded up to account for testing/error
// Can change this later to ~93600
const API_TIMEOUT = 100000;
const STOCK_ENDPOINT = process.env.STOCK_ENDPOINT || 'https://financialmodelingprep.com/api/v3/quote/';

const CRYPTO_ENDPOINT = process.env.CRYPTO_ENDPOINT || 'wss://ws-feed.exchange.coinbase.com';

export let socket: WebSocket | undefined;

export const app = express();

app.use(express.json());
app.use(morgan('dev'));

app.use('/api', tickerRoutes);

app.listen(EXPRESS_PORT, () => {
  if (process.env.DB) {
    connectDB(MONGO_URI).then(() => {
      console.log(`Stocktracker server listening on port ${EXPRESS_PORT}`);
    });
  } else {
    console.log('Database disabled, running express server only');
  }
});

if (process.env.SERVER_QUERYING && process.env.DB) {
  socket = await createDataSocket(CRYPTO_ENDPOINT);
  pollApi(STOCK_ENDPOINT, API_TIMEOUT);
}
