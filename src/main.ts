import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import pinia from './store';
import './assets/main.css';

const app = createApp(App);

app.use(pinia);
app.use(router);

void router.isReady().then(() => {
  app.mount('#app');
});
