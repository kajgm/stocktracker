import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useTickerStore } from './store/ticker';
import socket from './socket/socket';
import { startClock } from './helpers/now';
import App from './App.vue';
import router from './router';
import './assets/main.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);

useTickerStore().bindEvents();
socket.connect();
startClock();

void router.isReady().then(() => {
  app.mount('#app');
});
