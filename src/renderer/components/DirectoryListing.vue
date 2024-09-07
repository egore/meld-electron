<script lang="ts" setup>
import { ref } from 'vue'
import { FileInfo } from '../typings/electron'
import FileSize from '../components/FileSize.vue'

function join(...elements: string[]): string {
  return elements.map((element, index) => `${index === 0 ? '' : '/'}${element}`).join('')
}

const props = defineProps<{
  left: string
  right: string
  skipIdentical: boolean
  showFileDiff: (left: string, right: string) => void
}>()

const filesLeft = ref([] as FileInfo[])
const filesRight = ref([] as FileInfo[])

const pairs = ref([] as { left: FileInfo; right: FileInfo }[])

async function init() {
  filesLeft.value = await window.electronAPI.listDirectory(props.left)
  filesLeft.value.sort()
  filesRight.value = await window.electronAPI.listDirectory(props.right)
  filesRight.value.sort()

  let j = 0
  for (const element of filesLeft.value) {
    const leftFile = element
    for (; j < filesRight.value.length; j++) {
      const rightFile = filesRight.value[j]
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

function getColor(fileA: FileInfo, fileB: FileInfo): string {
  if (fileA.type === 'dummy') {
    return 'lightgray'
  }
  if (fileA.name && fileB.type === 'dummy') {
    return '#219a32'
  }
  if (fileB.name && fileA.sha1sum !== fileB.sha1sum) {
    return '#3370e5'
  }
  return 'inherit'
}

init()
</script>

<template>
  <div class="row" v-for="pair in pairs">
    <div class="col-sm-6">
      <div class="row" :style="{ color: getColor(pair.left, pair.right) }">
        <span class="col-sm-1">
          <IBiFileEarmark v-if="pair.left.type === 'file'" />
          <IBiFolderFill v-if="pair.left.type === 'dir'" />
        </span>
        <span class="col-sm-8">
          <span
            @click="showFileDiff(join(left, pair.left.name), join(right, pair.right.name))"
            style="cursor: pointer"
            v-if="pair.left.type === 'file' && pair.right.type === 'file'"
          >
            {{ pair.left.name }}
          </span>
          <span v-else>
            {{ pair.left.name }}
          </span>
        </span>
        <span class="col-sm-3"><FileSize :size="pair.left.size"></FileSize></span>
      </div>
    </div>
    <div class="col-sm-6">
      <div class="row" :style="{ color: getColor(pair.right, pair.left) }">
        <span class="col-sm-1">
          <IBiFileEarmark v-if="pair.right.type === 'file'" />
          <IBiFolderFill v-if="pair.right.type === 'dir'" />
        </span>
        <span class="col-sm-8">
          <span
            @click="() => showFileDiff(join(left, pair.left.name), join(right, pair.right.name))"
            style="cursor: pointer"
            v-if="pair.left.type === 'file' && pair.right.type === 'file'"
          >
            {{ pair.right.name }}
          </span>
          <span v-else>
            {{ pair.right.name }}
          </span>
        </span>
        <span class="col-sm-3"><FileSize :size="pair.right.size"></FileSize></span>
      </div>
    </div>
  </div>
</template>
