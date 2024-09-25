/**
 * MIT License
 * Copyright (c) 2023 草鞋没号
 * Copyright (c) 2024 Christoph Brill
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { app, dialog, BrowserWindow, shell, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path, { join } from 'node:path'
import os from 'node:os'
import { copyFileSync, readFileSync, readdirSync, statSync, existsSync, watch } from 'node:fs'
import { createHash } from 'node:crypto'
import trash from 'trash'
import { FSWatcher } from 'node:original-fs'

// This needs to stay in sync with src/electron.d.ts
export class FileInfo {
  name: string
  size: number
  sha1sum: string
  type: 'file' | 'directory' | 'dummy'
  dateModified: Date
  numChildren?: number
}

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC as string, 'favicon.ico'),
    webPreferences: {
      preload
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  for (const filePath of Object.keys(watchers)) {
    watchers[filePath].close()
    delete watchers[filePath]
  }
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

ipcMain.handle('loadFile', (event, filePath) => {
  return readFileSync(filePath, 'utf-8')
})

ipcMain.handle('listDirectory', async (event, dirPath: string) => {
  const content = readdirSync(dirPath)
  const files = [] as FileInfo[]
  for (const file of content) {
    const filePath = join(dirPath, file)
    const stats = statSync(filePath)
    const type = stats.isDirectory() ? 'directory' : 'file'
    let sha1sum = ''
    if (type !== 'directory') {
      const hash = createHash('sha1')
      hash.update(readFileSync(filePath))
      sha1sum = hash.digest('hex')
    }
    let numChildren = undefined
    if (type === 'directory') {
      numChildren = readdirSync(filePath).length
    }

    files.push({
      name: file,
      size: stats.size,
      sha1sum: sha1sum,
      type: type,
      dateModified: stats.mtime,
      numChildren: numChildren
    })
  }
  return files
})

const watchers: Record<string, FSWatcher> = {}

function removeWatcher(filePath: string): void {
  if (watchers[filePath]) {
    //win?.webContents.send('main-process-message', `Unregistering ${filePath}`)
    watchers[filePath].close()
    delete watchers[filePath]
  }
}

function addWatcher(filePath: string): void {
  const watcher = watch(filePath, (event_) => {
    if (existsSync(filePath)) {
      const stats = statSync(filePath)
      win?.webContents.send('file-changed', filePath, stats.mtime.getTime(), event_)
      if (event_ === 'rename') {
        removeWatcher(filePath)
        addWatcher(filePath)
      }
    }
  })
  watchers[filePath] = watcher
}

ipcMain.handle('watchFile', (event, filePath) => {
  if (watchers[filePath]) {
    removeWatcher(filePath)
  }
  addWatcher(filePath)
})

ipcMain.handle('unwatchFile', (event, filePath) => {
  removeWatcher(filePath)
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

ipcMain.handle('filesExist', (event, ...filePaths: string[]) => {
  const result = filePaths.map((filePath) => {
    return existsSync(filePath)
  })
  return result
})

ipcMain.handle('copyFile', (event, sourcePath: string, destPath: string, overwrite?: boolean) => {
  if (!statSync(sourcePath).isFile()) {
    return
  }
  if (!overwrite && existsSync(destPath)) {
    return
  }
  copyFileSync(sourcePath, destPath)
})

ipcMain.handle('deleteFile', async (event, filePath: string) => {
  if (!statSync(filePath).isFile()) {
    return
  }
  await trash(filePath)
})

ipcMain.handle('deleteDirectory', async (event, dirPath: string) => {
  if (!statSync(dirPath).isDirectory()) {
    return
  }
  await trash(dirPath)
})
