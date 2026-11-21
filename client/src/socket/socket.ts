import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000/';

// Connected explicitly from main.ts so importing the store (e.g. in tests) has no side effects.
const socket = io(SERVER_URL, { autoConnect: false });

export default socket;
