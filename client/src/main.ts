/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import pinia from './store';
import './assets/main.css';

const app = createApp(App);

app.use(pinia);
app.use(router);

// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
void router.isReady().then(() => {
  app.mount('#app');
});
