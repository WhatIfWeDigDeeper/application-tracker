import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './style.css';

// Routes
const routes = [
  {
    path: '/',
    name: 'applications',
    component: () => import('./views/ApplicationList.vue'),
  },
  {
    path: '/applications/:id',
    name: 'application-detail',
    component: () => import('./views/ApplicationDetail.vue'),
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp(App);
app.use(router);
app.mount('#app');
