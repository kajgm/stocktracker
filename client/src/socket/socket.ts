import { io } from 'socket.io-client';

const SOCKET_URI = process.env.SERVER_URI || 'http://localhost:3000/';
const socket = io(SOCKET_URI);

export default socket;
