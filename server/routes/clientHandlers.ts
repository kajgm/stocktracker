import { getTrackedTickers } from 'helpers/helpers.js';
import { Server, Socket } from 'socket.io';

export default function registerHandlers(_io: Server, socket: Socket) {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  pollEmit(socket);
}

async function pollEmit(socket: Socket) {
  const { stockTickers, cryptoTickers } = await getTrackedTickers();
  console.log('Emitting');
  console.log(stockTickers);
  console.log(cryptoTickers);
  socket.emit('stockTickers', stockTickers);
  socket.emit('cryptoTickers', cryptoTickers);
  setTimeout(pollEmit, 10000);
}
