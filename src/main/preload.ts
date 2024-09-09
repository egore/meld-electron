import { contextBridge, ipcRenderer } from 'electron'
import ElectronApi from '../renderer/typings/electron'

const electronAPI: ElectronApi = {
  sendMessage: (message: string) => ipcRenderer.send('message', message),
  loadFile: (filePath: string) => ipcRenderer.invoke('loadFile', filePath),
  listDirectory: (dirPath: string) => ipcRenderer.invoke('listDirectory', dirPath),
  selectFile: (defaultPath?: string) => ipcRenderer.invoke('selectFile', defaultPath),
  selectDirectory: (defaultPath?: string) => ipcRenderer.invoke('selectDirectory', defaultPath),
  copyFile: (sourcePath: string, destPath: string) =>
    ipcRenderer.invoke('copyFile', sourcePath, destPath),
  deleteFile: (filePath: string) => ipcRenderer.invoke('deleteFile', filePath)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
