<script setup lang="ts">
import { onMounted } from 'vue';
import { websocketConnect } from './socket/socket';
import { restApiPoll } from './api/api';
import TickerGrid from './views/TickerGrid.vue';

onMounted(() => {
  // Crypto Coinbase websocket
  websocketConnect();

  // Financial Modeling Prep api polling
  if (import.meta.env.VITE_VUE_APP_FMP_KEY) {
    restApiPoll();
  } else {
    console.log('.env file with api key not created!');
  }
});
</script>

<template>
  <TickerGrid />
</template>
