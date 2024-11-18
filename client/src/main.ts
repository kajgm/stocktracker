/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { io } from 'socket.io-client';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/main.css';

const app = createApp(App);
const pinia = createPinia();
const socket = io('http://localhost:3000');
socket.emit('test', 'test');

app.use(pinia);
app.use(router);

// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
void router.isReady().then(() => {
  app.mount('#app');
});
