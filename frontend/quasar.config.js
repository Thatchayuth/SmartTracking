/* eslint-env node */
const { configure } = require('quasar/wrappers');

module.exports = configure((/* ctx */) => {
  return {
    boot: [
      'axios',
      'google-maps',
    ],

    css: ['app.scss'],

    extras: [
      'roboto-font',
      'material-icons',
    ],

    build: {
      target: { browser: ['es2022', 'firefox115', 'chrome115', 'safari14'] },
      vueRouterMode: 'history',
      env: {
        API_URL: process.env.API_URL || 'http://localhost:3000',
      },
      vitePlugins: [],
    },

    devServer: {
      port: 9000,
      open: false,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/socket.io': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          ws: true,
        },
      },
    },

    framework: {
      config: {
        notify: {},
        loading: {},
      },
      plugins: ['Notify', 'Loading', 'Dialog', 'LocalStorage', 'SessionStorage'],
    },

    animations: [],

    ssr: { pwa: false },

    pwa: {
      workboxMode: 'GenerateSW',
    },
  };
});
