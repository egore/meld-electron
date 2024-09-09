import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

import { createApp } from 'vue'
import { createBootstrap } from 'bootstrap-vue-next'

import './style.css'
import App from './App.vue'

window.ipcRenderer.on('main-process-message', (_event, ...args) => {
  console.log('[Receive Main-process message]:', ...args)
})

createApp(App)
  .use(createBootstrap())
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })

import 'bootstrap/dist/js/bootstrap.js'
