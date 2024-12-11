import { getTrackedCryptoData, getTrackedStockData, getTrackedTickers } from 'helpers/helpers.js';
import { Server, Socket } from 'socket.io';

export default async function registerHandlers(_io: Server, socket: Socket) {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  const { stockTickers, cryptoTickers } = await getTrackedTickers();

  const emitMsg = {
    crypto: cryptoTickers,
    stock: stockTickers
  };

  socket.emit('updateTickers', emitMsg);

  pollEmit(socket);
}

async function pollEmit(socket: Socket) {
  const stockData = await getTrackedStockData();
  const cryptoData = await getTrackedCryptoData();

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
