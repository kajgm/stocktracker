import { Server, Socket } from 'socket.io';
import { StockDB } from '../models/Stock.js';
import { CryptoDB } from '../models/Crypto.js';
import { ConfigDB } from '../models/Config.js';
import { DB_USER } from '../server.js';

export default async function registerHandlers(_io: Server, socket: Socket) {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  let emitMsg: { stock: string[]; crypto: string[] };

  if (process.env.DB && process.env.DB == 'true') {
    const userConfig = (await ConfigDB.findOne({ user: DB_USER }).lean()) || { cryptoTickers: [], stockTickers: [] };
    const stockTickers = userConfig.stockTickers;
    const cryptoTickers = userConfig.cryptoTickers;

    emitMsg = {
      stock: stockTickers,
      crypto: cryptoTickers
    };
  } else {
    emitMsg = {
      stock: [],
      crypto: []
    };
  }

  socket.emit('updateTickers', emitMsg);
  pollEmit(socket);
}

async function pollEmit(socket: Socket) {
  if (process.env.DB && process.env.DB == 'true') {
    const stockData = await StockDB.find();
    const cryptoData = await CryptoDB.find();

    for (const stock of stockData) {
      socket.emit('stockUpdate', stock);
    }

    for (const crypto of cryptoData) {
      socket.emit('cryptoUpdate', crypto);
    }

    if (!socket.disconnected) {
      setTimeout(pollEmit, 100, socket);
    }
  }
}
