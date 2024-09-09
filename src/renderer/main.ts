import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

import { createApp } from 'vue'
import { createBootstrap } from 'bootstrap-vue-next'

import './style.css'
import App from './App.vue'

const app = createApp(App)

app.use(createBootstrap())

app.mount('#app')

import 'bootstrap/dist/js/bootstrap.js'
