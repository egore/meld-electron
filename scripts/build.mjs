import { join } from 'path'
import pkg from 'chalk'
const { blueBright, greenBright } = pkg
import { rmSync } from 'fs'
import { build } from 'vite'
import compileTs from './private/tsc.mjs'
const __dirname = import.meta.dirname

function buildRenderer() {
  return build({
    configFile: join(__dirname, '..', 'vite.config.js'),
    base: './',
    mode: 'production'
  })
}

function buildMain() {
  const mainPath = join(__dirname, '..', 'src', 'main')
  return compileTs(mainPath)
}

rmSync(join(__dirname, '..', 'build'), {
  recursive: true,
  force: true
})

console.log(blueBright('Transpiling renderer & main...'))

Promise.allSettled([buildRenderer(), buildMain()]).then(() => {
  console.log(
    greenBright(
      'Renderer & main successfully transpiled! (ready to be built with electron-builder)'
    )
  )
})
