// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  devServer: {
    host: 'localhost',
    port: 5000
  },
  css: [
    'bootstrap/dist/css/bootstrap.min.css',
  ],
  runtimeConfig: {
    public: {
      api_url: process.env.API_URL,
    }
  }
})
