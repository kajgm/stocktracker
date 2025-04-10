import { config } from 'dotenv';
config();

import express from 'express';
import morgan from 'morgan';
import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import { pollApi, queryApi } from './config/dataApi.js';
import connectDB from './config/db.js';
import tickerRoutes from './routes/tickerRoutes.js';
import createDataSocket from './config/dataSocket.js';
import registerHandlers from './routes/clientHandlers.js';

export const STOCK_TIMEOUT = 100000;
export const CRYPTO_TIMEOUT = 10000;
export const DB_USER = process.env.DB_USER || 'localhost';
const EXPRESS_PORT = process.env.PORT || 3000;

export let cbSocket: WebSocket | { close: () => void };

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:8080', 'http://localhost:5173']
  }
});

app.use(express.json());
app.use(morgan('dev'));
app.use('/api', tickerRoutes);

io.on('connection', (socket: Socket) => registerHandlers(io, socket));

server.listen(EXPRESS_PORT, () => {
  if (process.env.DB) {
    connectDB().then(() => {
      console.log(`Stocktracker server listening on port ${EXPRESS_PORT}`);
    });
  } else {
    console.log('Database disabled, running express server only');
  }
});

if (process.env.DB) {
  cbSocket = await createDataSocket();
  queryApi();
  setTimeout(pollApi, STOCK_TIMEOUT);
}
