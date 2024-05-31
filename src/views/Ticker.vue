<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import HelloWorld from '../components/HelloWorld.vue';

const tickerPrice = ref({});
const fetchingData = ref(false);

async function fetchPrice() {
  fetchingData.value = true;
  await axios
    .get('https://api.coinbase.com/v2/prices/ETH-USD/spot')
    .then((res) => {
      //console.log(res);
      tickerPrice.value = JSON.stringify(res.data);
    })
    .catch((errors) => {
      console.log(errors);
    });
  const autoReloadInterval = setTimeout(fetchPrice, 1000);
  //clearInterval(autoReloadInterval); // stop the auto refresh
}

onMounted(async () => {
  await fetchPrice();
});
</script>

<template>
  <header>
    <div class="wrapper">
      <HelloWorld msg="Stock Tracker" />
      {{ tickerPrice }}
    </div>
  </header>
</template>

<style scoped>
header {
  line-height: 1.5;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
