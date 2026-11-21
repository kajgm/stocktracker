import { io } from 'socket.io-client';

// Default: the page's own origin. In production nginx proxies /socket.io to the
// server; in development the Vite dev server does (see vite.config.ts).
// Set VITE_SERVER_URL at build time only to reach a server on another origin.
const SERVER_URL = import.meta.env.VITE_SERVER_URL;

// Connected explicitly from main.ts so importing the store (e.g. in tests) has no side effects.
const socket = SERVER_URL ? io(SERVER_URL, { autoConnect: false }) : io({ autoConnect: false });

export default socket;
