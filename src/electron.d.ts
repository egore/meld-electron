// This needs to stay in sync with electron/main/index.ts
class FileInfo {
  name: string
  equivalentName?: string
  size: number
  sha1sum: string
  type: ComparisonType | 'dummy'
  dateModified: Date
}
