import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useTickerStore } from './store/ticker';
import socket from './socket/socket';
import { startClock } from './helpers/now';
import { createUpdateChecker } from './helpers/updates';
import { watchViewport } from './helpers/viewport';
import App from './App.vue';
import router from './router';
import './assets/main.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);

useTickerStore().bindEvents();
socket.connect();
startClock();
watchViewport();

void router.isReady().then(() => {
  app.mount('#app');
});

// Reload when a new UI version is deployed. Not on the settings page, where it
// would throw away unsaved edits: it shows a prompt there, and the reload
// happens on leaving it.
if (import.meta.env.PROD) {
  const CHECK_EVERY_MS = 5 * 60_000;
  // A deploy usually restarts the server too; check soon after reconnecting,
  // leaving the client pod time to roll as well.
  const CHECK_AFTER_RECONNECT_MS = 20_000;

  const updates = createUpdateChecker({ isBusy: () => router.currentRoute.value.name == 'settings' });
  setInterval(() => void updates.check(), CHECK_EVERY_MS);
  socket.io.on('reconnect', () => setTimeout(() => void updates.check(), CHECK_AFTER_RECONNECT_MS));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState == 'visible') void updates.check();
  });
  router.afterEach(() => updates.applyIfIdle());
}
