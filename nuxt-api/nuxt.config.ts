export default defineNuxtConfig({
  compatibilityDate: '2025-05-04',

  devServer: {
    port: 5040,
  },

  // API-only mode: no client-side rendering needed yet
  ssr: false,

  nitro: {
    // Enable CORS for vue-ui dev server
    routeRules: {
      '/api/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': 'http://localhost:3020',
          'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      },
    },
  },

  modules: [],
});
