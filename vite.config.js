import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next'
import IconsResolve from 'unplugin-icons/resolver'

import { join } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  root: join(__dirname, 'src', 'renderer'),
  publicDir: 'public',
  server: {
    port: 8080
  },
  open: false,
  build: {
    outDir: join(__dirname, 'build', 'renderer'),
    emptyOutDir: true
  },
  plugins: [
    vue(),
    Components({
      resolvers: [BootstrapVueNextResolver(), IconsResolve()],
      dts: true
    }),
    Icons({
      compiler: 'vue3',
      autoInstall: true
    })
  ]
})
