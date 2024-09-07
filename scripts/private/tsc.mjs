import { exec } from 'child_process'
import pkg from 'chalk'
const { yellowBright, white } = pkg

function compile(directory) {
  return new Promise((resolve, reject) => {
    const tscProcess = exec('tsc', {
      cwd: directory
    })

    tscProcess.stdout.on('data', (data) =>
      process.stdout.write(yellowBright(`[tsc] `) + white(data.toString()))
    )

    tscProcess.on('exit', (exitCode) => {
      if (exitCode > 0) {
        reject(exitCode)
      } else {
        resolve()
      }
    })
  })
}

export default compile
