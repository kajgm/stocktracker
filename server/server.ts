import { config } from 'dotenv';
config();

import express from 'express';
import morgan from 'morgan';
import tickerRoutes from './routes/tickerRoutes.js';
import connectDB from './config/db.js';
import pollApi from './config/api.js';
import createDataSocket from './config/socket.js';

const EXPRESS_PORT = process.env.PORT || 3000;

export let socket: WebSocket;

export const app = express();

app.use(express.json());
app.use(morgan('dev'));

app.use('/api', tickerRoutes);

app.listen(EXPRESS_PORT, () => {
  if (process.env.DB) {
    connectDB().then(() => {
      console.log(`Stocktracker server listening on port ${EXPRESS_PORT}`);
    });
  } else {
    console.log('Database disabled, running express server only');
  }
});

if (process.env.SERVER_QUERYING && process.env.DB) {
  socket = await createDataSocket();
  pollApi();
}
