import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import Parse from '@/lib/parse';
import App from './App.vue';
import './style.css';

// Initialize Parse SDK
Parse.initialize(
  import.meta.env.VITE_PARSE_APP_ID || 'job-tracker-app',
  import.meta.env.VITE_PARSE_JS_KEY || 'js-key-change-in-production'
);
Parse.serverURL = import.meta.env.VITE_PARSE_SERVER_URL || '/parse';

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
