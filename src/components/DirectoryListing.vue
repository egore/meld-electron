<script lang="ts" setup>
import { ref } from 'vue'
import { format } from 'date-fns'

import FileSize from '../components/FileSize.vue'

function join(...elements: string[]): string {
  return elements.map((element, index) => `${index === 0 ? '' : '/'}${element}`).join('')
}

const props = defineProps<{
  left: string
  right: string
  skipIdentical: boolean
  ignorePatterns?: RegExp[]
  showFileDiff: (left: string, right: string) => void
  showDirectoryDiff: (left: string, right: string) => void
}>()

const filesLeft = ref([] as FileInfo[])
const filesRight = ref([] as FileInfo[])

const pairs = ref([] as { left: FileInfo; right: FileInfo }[])

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

async function init() {
  filesLeft.value = await window.ipcRenderer.invoke('listDirectory', props.left)
  filesLeft.value.sort()
  filesRight.value = await window.ipcRenderer.invoke('listDirectory', props.right)
  filesRight.value.sort()

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
      if (leftFile.name === rightFile.name) {
        if (
          leftFile.type !== 'file' ||
          !props.skipIdentical ||
          leftFile.sha1sum !== rightFile.sha1sum
        ) {
          pairs.value.push({ left: leftFile, right: rightFile })
        }
        j++
        break
      } else if (leftFile.name < rightFile.name) {
        pairs.value.push({
          left: leftFile,
          right: { size: 0, type: 'dummy', name: leftFile.name } as FileInfo
        })
        break
      } else if (leftFile.name > rightFile.name) {
        pairs.value.push({
          left: { size: 0, type: 'dummy', name: rightFile.name } as FileInfo,
          right: rightFile
        })
      }
    }
  }
}

function getStyle(fileA: FileInfo, fileB: FileInfo, isLeft: boolean) {
  if (fileA.type === 'dummy') {
    return { color: 'lightgray', 'text-decoration': 'line-through' }
  }
  if (fileA.name && fileB.type === 'dummy') {
    return { color: isLeft ? '#bf0000' : '#219a32' }
  }
  if (fileB.name && fileA.sha1sum !== fileB.sha1sum) {
    return { color: '#3370e5' }
  }
  return {}
}

async function copyFile(sourcePath: string, destPath: string) {
  await window.ipcRenderer.invoke('copyFile', sourcePath, destPath)
  init()
}

async function deleteFile(filePath: string) {
  await window.ipcRenderer.invoke('deleteFile', filePath)
  init()
}

init()
</script>

<template>
  <div class="row" v-for="pair in pairs">
    <div class="col-sm-6">
      <div class="row" :style="getStyle(pair.left, pair.right, true)">
        <span class="col-sm-1 oneline" style="width: 36px">
          <IBiFileEarmark v-if="pair.left.type === 'file'" />
          <IBiFolderFill v-if="pair.left.type === 'directory'" />
        </span>
        <span class="col-sm-6 p-0 oneline">
          <span
            @click="showFileDiff(join(left, pair.left.name), join(right, pair.right.name))"
            style="cursor: pointer"
            v-if="pair.left.type === 'file' && pair.right.type === 'file'"
          >
            {{ pair.left.name }}
          </span>
          <span
            @click="showDirectoryDiff(join(left, pair.left.name), join(right, pair.right.name))"
            style="cursor: pointer"
            v-else-if="pair.left.type === 'directory' && pair.right.type === 'directory'"
          >
            {{ pair.left.name }}
          </span>
          <span v-else-if="pair.left.type !== 'file'">
            {{ pair.left.name }}
          </span>
          <span v-else>
            <BPopover :click="true" :close-on-hide="true" :delay="{ show: 0, hide: 0 }">
              <template #target>
                <BButton variant="link" style="padding: 0; color: inherit; text-decoration: none">{{
                  pair.left.name
                }}</BButton>
              </template>
              <BButton
                variant="success"
                size="sm"
                class="ml-2"
                @click="copyFile(join(left, pair.left.name), join(right, pair.right.name))"
                >Copy</BButton
              >
              <BButton
                variant="danger"
                size="sm"
                class="ml-2"
                @click="deleteFile(join(left, pair.left.name))"
                >Delete</BButton
              >
            </BPopover>
          </span>
        </span>
        <span class="col-sm-3 p-0 oneline">{{
          pair.left.dateModified ? format(pair.left.dateModified, 'Pp') : ''
        }}</span>
        <span class="col-sm-2 p-0 oneline"><FileSize :size="pair.left.size"></FileSize></span>
      </div>
    </div>
    <div class="col-sm-6">
      <div class="row" :style="getStyle(pair.right, pair.left, false)">
        <span class="col-sm-1 oneline" style="width: 36px">
          <IBiFileEarmark v-if="pair.right.type === 'file'" />
          <IBiFolderFill v-if="pair.right.type === 'directory'" />
        </span>
        <span class="col-sm-6 p-0 oneline">
          <span
            @click="() => showFileDiff(join(left, pair.left.name), join(right, pair.right.name))"
            style="cursor: pointer"
            v-if="pair.left.type === 'file' && pair.right.type === 'file'"
          >
            {{ pair.right.name }}
          </span>
          <span v-else-if="pair.right.type !== 'file'">
            {{ pair.right.name }}
          </span>
          <span v-else>
            <BPopover :click="true" :close-on-hide="true" :delay="{ show: 0, hide: 0 }">
              <template #target>
                <BButton variant="link" style="padding: 0; color: inherit; text-decoration: none">{{
                  pair.right.name
                }}</BButton>
              </template>
              <BButton
                variant="success"
                size="sm"
                class="ml-2"
                @click="copyFile(join(right, pair.right.name), join(left, pair.left.name))"
                >Copy</BButton
              >
              <BButton
                variant="danger"
                size="sm"
                class="ml-2"
                @click="deleteFile(join(right, pair.right.name))"
                >Delete</BButton
              >
            </BPopover>
          </span>
        </span>
        <span class="col-sm-3 p-0 oneline">{{
          pair.right.dateModified ? format(pair.right.dateModified, 'Pp') : ''
        }}</span>
        <span class="col-sm-2 p-0 oneline"><FileSize :size="pair.right.size"></FileSize></span>
      </div>
    </div>
  </div>
</template>

<style>
.oneline {
  white-space: nowrap;
  overflow: clip;
}
</style>
