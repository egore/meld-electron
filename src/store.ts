import { createGlobalState, useStorage } from '@vueuse/core'
import { Equivalent } from './components/EquivalentsSettings.vue'

export type HistoryElement = {
  type: ComparisonType
  left: string
  right: string
  equivalents?: Equivalent[]
}

export type ComparisonType = 'directory' | 'file'

export type FilenameFilter = {
  pattern: string[]
  enabled: boolean
}

export type Settings = {
  directory: {
    ignoreIdentical: boolean
    enableTree: boolean
    filenameFilters: Record<string, FilenameFilter>
  }
  history: HistoryElement[]
  fontSize: string
}

export const appState = createGlobalState(() => {
  return useStorage(
    'state',
    {
      directory: {
        ignoreIdentical: true,
        enableTree: false,
        filenameFilters: {
          Backups: {
            pattern: ['#*#', '.#*', '~*', '*~', '*.{orig,bak,swp}'],
            enabled: true
          },
          'OS-Specific Metadata': {
            pattern: [
              '.DS_Store',
              '._*',
              '.Spotlight-V100',
              '.Trashes',
              'Thumbs.db',
              'Desktop.ini'
            ],
            enabled: true
          },
          'Version Control': {
            pattern: [
              '_MTN',
              '.bzr',
              '.svn',
              '.hg',
              '.fslckout',
              '_FOSSIL_',
              '.fos',
              'CVS',
              '_darcs',
              '.git',
              '.osc'
            ],
            enabled: true
          },
          Binaries: {
            pattern: ['*.{pyc,a,obj,o,so,la,lib,dll,exe}'],
            enabled: true
          },
          Media: {
            pattern: [
              '*.{jxl,jpg,jpeg,gif,png,avif,webp,heif,heic,bmp,tif,tiff,raw,dng,cr2,wav,wave,mp3,ogg,oga,vorbis,spx,opus,flac,ac3,aac,aif,aiff,aifc,alac,m4a,3gp,wma,aup,aup3,avi,mov,mpg,mpeg,mp4,m4v,webm,ogv,flv,xcf,xpm,ora,kra,psd,psp}'
            ],
            enabled: false
          },
          Development: {
            pattern: ['node_modules', 'target'],
            enabled: true
          }
        }
      },
      history: [] as HistoryElement[],
      fontSize: '16px'
    } as Settings,
    localStorage,
    { mergeDefaults: true }
  )
})
