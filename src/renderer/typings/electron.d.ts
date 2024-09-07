/**
 * Should match main/preload.ts for typescript support in renderer
 */
export default interface ElectronApi {
  sendMessage: (message: string) => void
  loadFile: (filePath: string) => Promise<string>
  listDirectory: (dirPath: string) => Promise<FileInfo[]>
  selectFile: (defaultPath?: string) => Promise<string>
  selectDirectory: (defaultPath?: string) => Promise<string>
}

export class FileInfo {
  name: string
  size: number
  sha1sum: string
  type: 'dir' | 'file' | 'dummy'
}

declare global {
  interface Window {
    electronAPI: ElectronApi
  }
}
