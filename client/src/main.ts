/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useTickerStore } from './store/ticker.js';
import socket from './socket/socket.js';
import App from './App.vue';
import router from './router';
import './assets/main.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const tickerStore = useTickerStore();
socket.off();
tickerStore.bindEvents();

// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
void router.isReady().then(() => {
  app.mount('#app');
});
