import { ComparisonType } from '../store'

/**
 * Should match main/preload.ts for typescript support in renderer
 */
export default interface ElectronApi {
  sendMessage: (message: string) => void
  loadFile: (filePath: string) => Promise<string>
  listDirectory: (dirPath: string) => Promise<FileInfo[]>
  selectFile: (defaultPath?: string) => Promise<string>
  selectDirectory: (defaultPath?: string) => Promise<string>
  copyFile: (sourcePath: string, destPath: string) => Promise<void>
  deleteFile: (filePath: string) => Promise<void>
}

export class FileInfo {
  name: string
  size: number
  sha1sum: string
  type: ComparisonType | 'dummy'
  dateModified: Date
}

declare global {
  interface Window {
    electronAPI: ElectronApi
  }
}
