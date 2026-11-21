import { createWebHistory, createRouter } from 'vue-router';
import TickerGrid from '@/views/TickerGrid.vue';
const Chart = () => import('@/views/Chart.vue');
const Settings = () => import('@/views/Settings.vue');

const routes = [
  {
    path: '/',
    component: TickerGrid,
    name: 'home',
    meta: { title: 'Home' }
  },
  {
    path: '/settings',
    component: Settings,
    name: 'settings',
    meta: { title: 'Settings' }
  },
  {
    path: '/:tickerType/:tickerId',
    component: Chart,
    name: 'chart',
    props: true,
    meta: { title: ':tickerId' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
