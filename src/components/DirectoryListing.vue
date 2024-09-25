<script lang="ts" setup>
import { computed, ref } from 'vue'
import { Equivalent } from './EquivalentsSettings.vue'
import { appState } from '../store'
import { ComparisonStarterFunction } from '../types'

function join(...elements: string[]): string {
  return elements.map((element, index) => `${index === 0 ? '' : '/'}${element}`).join('')
}

const props = defineProps<{
  left: string
  right: string
  skipIdentical: boolean
  ignorePatterns?: RegExp[]
  equivalents: Equivalent[]
  startFileComparison: ComparisonStarterFunction
  startDirectoryComparison: ComparisonStarterFunction
}>()

const filesLeft = ref([] as FileInfo[])
const filesRight = ref([] as FileInfo[])

const pairs = ref([] as { left: FileInfo; right: FileInfo }[])

const state = appState()

function isSkipped(file: FileInfo) {
  let skip = false
  if (props.ignorePatterns) {
    for (const pattern of props.ignorePatterns) {
      const match = pattern.exec(file.name)
      if (match) {
        skip = true
        break
      }
    }
  }
  return skip
}

function initEquivalents(file: FileInfo) {
  if (!file.equivalentName) {
    file.equivalentName = file.name
    if (props.equivalents) {
      for (const equivalent of props.equivalents) {
        if (equivalent.right) {
          file.equivalentName = file.equivalentName.replace(equivalent.right, equivalent.left)
        }
      }
    }
  }
}

async function init() {
  filesLeft.value = await window.ipcRenderer.invoke('listDirectory', props.left)
  filesLeft.value.sort()
  filesRight.value = await window.ipcRenderer.invoke('listDirectory', props.right)
  for (const file of filesRight.value) {
    initEquivalents(file)
  }
  filesRight.value.sort((a, b) => {
    return (a.equivalentName as string) < (b.equivalentName as string) ? -1 : 1
  })

  pairs.value = []

  let j = 0
  for (const element of filesLeft.value) {
    const leftFile = element
    if (isSkipped(leftFile)) {
      continue
    }
    for (; j < filesRight.value.length; j++) {
      const rightFile = filesRight.value[j]
      if (isSkipped(rightFile)) {
        continue
      }
      if (leftFile.name === rightFile.equivalentName) {
        if (
          leftFile.type !== 'file' ||
          !props.skipIdentical ||
          leftFile.sha1sum !== rightFile.sha1sum
        ) {
          pairs.value.push({ left: leftFile, right: rightFile })
        }
        j++
        break
      } else if (leftFile.name < (rightFile.equivalentName as string)) {
        pairs.value.push({
          left: leftFile,
          right: { size: 0, type: 'dummy', name: leftFile.name } as FileInfo
        })
        break
      } else if (leftFile.name > (rightFile.equivalentName as string)) {
        pairs.value.push({
          left: { size: 0, type: 'dummy', name: rightFile.name } as FileInfo,
          right: rightFile
        })
      }
    }
  }
}

async function copyFile(sourcePath: string, destPath: string) {
  await window.ipcRenderer.invoke('copyFile', sourcePath, destPath)
  init()
}

async function overwriteFile(sourcePath: string, destPath: string) {
  await window.ipcRenderer.invoke('copyFile', sourcePath, destPath, true)
  init()
}

async function deleteFile(filePath: string) {
  await window.ipcRenderer.invoke('deleteFile', filePath)
  init()
}

async function deleteDirectory(filePath: string) {
  await window.ipcRenderer.invoke('deleteDirectory', filePath)
  init()
}

const equivalentsKey = computed(() => {
  let len = 0
  for (const e of props.equivalents) {
    len += e.left.length + e.right.length
  }
  return len
})

const enableTree = computed(() => {
  return state.value.directory.enableTree
})

init()
</script>

<template>
  <div class="row" v-for="pair in pairs">
    <div class="col-sm-6" style="width: calc(50% - 20px)">
      <DirectoryListingLine
        position="left"
        :pair="pair"
        :dirs="{ left: left, right: right }"
        :equivalents="equivalents"
        :start-file-comparison="startFileComparison"
        :start-directory-comparison="startDirectoryComparison"
        :delete-directory="deleteDirectory"
        :reload="init"
        :delete-file="deleteFile"
        :copy-file="copyFile"
      />
    </div>
    <div style="width: 40px; padding: 0; text-align: center">
      <span
        style="cursor: pointer"
        v-if="pair.left.type === 'file' && pair.right.type === 'dummy'"
        @click="copyFile(join(left, pair.left.name), join(right, pair.right.name))"
      >
        <IBiArrowRight />
      </span>
      <span
        style="cursor: pointer"
        v-if="pair.left.type === 'dummy' && pair.right.type === 'file'"
        @click="copyFile(join(right, pair.right.name), join(left, pair.left.name))"
      >
        <IBiArrowLeft />
      </span>
      <span
        style="cursor: pointer"
        v-if="pair.left.type === 'file' && pair.right.type === 'file'"
        @click="overwriteFile(join(right, pair.right.name), join(left, pair.left.name))"
      >
        <IBiArrowLeft />
      </span>
      <span
        style="cursor: pointer"
        v-if="pair.left.type === 'file' && pair.right.type === 'file'"
        @click="overwriteFile(join(left, pair.left.name), join(right, pair.right.name))"
      >
        <IBiArrowRight />
      </span>
    </div>
    <div class="col-sm-6" style="width: calc(50% - 20px)">
      <DirectoryListingLine
        position="right"
        :pair="pair"
        :dirs="{ left: left, right: right }"
        :equivalents="equivalents"
        :start-file-comparison="startFileComparison"
        :start-directory-comparison="startDirectoryComparison"
        :delete-directory="deleteDirectory"
        :reload="init"
        :delete-file="deleteFile"
        :copy-file="copyFile"
      />
    </div>
    <div
      v-if="
        enableTree &&
        !isSkipped(pair.left) &&
        !isSkipped(pair.right) &&
        pair.left.numChildren &&
        pair.left.type === 'directory' &&
        pair.right.type === 'directory'
      "
      class="collapse"
      :id="`collapse${pair.left.name}`"
    >
      <DirectoryListing
        :start-file-comparison="startFileComparison"
        :start-directory-comparison="startDirectoryComparison"
        :skip-identical="skipIdentical"
        v-if="pair.left.name && pair.right.name"
        :left="join(left, pair.left.name)"
        :right="join(right, pair.right.name)"
        :key="pair.left.name + pair.right.name + skipIdentical + equivalentsKey"
        :ignore-patterns="ignorePatterns"
        :equivalents="equivalents"
      />
    </div>
  </div>
</template>

<style>
.oneline {
  white-space: nowrap;
  overflow: clip;
}
</style>
