import 'bootstrap/dist/css/bootstrap.min.css'

import { createApp } from 'vue'
import { createBootstrap } from 'bootstrap-vue-next'

import './style.css'
import App from './App.vue'

const app = createApp(App)

app.use(createBootstrap({ components: true, directives: true }))

app.mount('#app')

import 'bootstrap/dist/js/bootstrap.js'
