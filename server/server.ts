import { config } from 'dotenv';
config();

import express from 'express';
import morgan from 'morgan';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import tickerRoutes from './routes/tickerRoutes.js';
import connectDB from './config/db.js';
import pollApi, { queryApi } from './config/dataApi.js';
import createDataSocket from './config/dataSocket.js';

const EXPRESS_PORT = process.env.PORT || 3000;

export let cbSocket: WebSocket;

export const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:8080', 'http://localhost:5173']
  }
});

app.use(express.json());
app.use(morgan('dev'));
app.use('/api', tickerRoutes);

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(EXPRESS_PORT, () => {
  if (process.env.DB) {
    connectDB().then(() => {
      console.log(`Stocktracker server listening on port ${EXPRESS_PORT}`);
    });
  } else {
    console.log('Database disabled, running express server only');
  }
});

if (process.env.SERVER_QUERYING && process.env.DB) {
  cbSocket = await createDataSocket();
  queryApi();
  setTimeout(pollApi, 100000);
}
