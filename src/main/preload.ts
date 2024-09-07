import { contextBridge, ipcRenderer } from 'electron'
import ElectronApi from '../renderer/typings/electron'

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message: string) => ipcRenderer.send('message', message),
  loadFile: (filePath: string) => ipcRenderer.invoke('loadFile', filePath),
  listDirectory: (dirPath: string) => ipcRenderer.invoke('listDirectory', dirPath),
  selectFile: (defaultPath?: string) => ipcRenderer.invoke('selectFile', defaultPath),
  selectDirectory: (defaultPath?: string) => ipcRenderer.invoke('selectDirectory', defaultPath)
} as ElectronApi)
