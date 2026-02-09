import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { enablePatches } from 'immer';
import App from './App.vue';
import './style.css';

// Enable Immer patch generation for undo/redo
enablePatches();

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

const pinia = createPinia();

const app = createApp(App);
app.use(pinia);
app.use(router);
app.mount('#app');
