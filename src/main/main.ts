import { app, BrowserWindow, ipcMain, session, dialog } from 'electron'
import { join } from 'path'
import { readFileSync, readdirSync, statSync } from 'fs'
import { FileInfo } from '../renderer/typings/electron'
import { createHash } from 'crypto'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (process.env.NODE_ENV === 'development') {
    const rendererPort = process.argv[2]
    mainWindow.loadURL(`http://localhost:${rendererPort}`)
  } else {
    mainWindow.loadFile(join(app.getAppPath(), 'renderer', 'index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.on('message', (event, message) => {
    console.log(message)
  })

  ipcMain.handle('loadFile', (event, filePath) => {
    return readFileSync(filePath, 'utf-8')
  })

  ipcMain.handle('listDirectory', async (event, dirPath: string) => {
    const content = readdirSync(dirPath)
    const files = [] as FileInfo[]
    for (const file of content) {
      const filePath = join(dirPath, file)
      var stats = statSync(filePath)
      const type = stats.isDirectory() ? 'dir' : 'file'
      let sha1sum = ''
      if (type !== 'dir') {
        var hash = createHash('sha1')
        hash.update(readFileSync(filePath))
        sha1sum = hash.digest('hex')
      }
      files.push({
        name: file,
        size: stats.size,
        sha1sum: sha1sum,
        type: type
      })
    }
    return files
  })

  ipcMain.handle('selectFile', async (event, defaultPath) => {
    const result = await dialog.showOpenDialog({
      defaultPath: defaultPath,
      properties: ['openFile']
    })
    return result.filePaths[0]
  })

  ipcMain.handle('selectDirectory', async (event, defaultPath) => {
    const result = await dialog.showOpenDialog({
      defaultPath: defaultPath,
      properties: ['openDirectory']
    })
    return result.filePaths[0]
  })

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["script-src 'self'"]
      }
    })
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
