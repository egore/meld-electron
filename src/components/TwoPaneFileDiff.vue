<script setup lang="ts">
import { ref } from 'vue'
import { diffLines, Change } from 'diff'

const props = defineProps<{
  left: string
  right: string
}>()

const leftFile = ref(props.left)
const rightFile = ref(props.right)

const chunks = ref([] as Change[])
const leftChunks = ref([] as Change[])
const rightChunks = ref([] as Change[])

async function init() {
  const leftText = await window.ipcRenderer.invoke('loadFile', leftFile.value)
  const rightText = await window.ipcRenderer.invoke('loadFile', rightFile.value)
  const chunks_ = diffLines(leftText, rightText)

  const left_ = []
  const right_ = []
  for (let i = 0; i < chunks_.length; i++) {
    const chunk = chunks_[i]
    if (chunk.added) {
      right_.push(chunk)
      if (i + 1 < chunks_.length && chunks_[i + 1].removed) {
        left_.push(chunks_[i + 1])
        i++
      } else {
        left_.push({ value: '' })
      }
    } else if (chunk.removed) {
      left_.push(chunk)
      if (i + 1 < chunks_.length && chunks_[i + 1].added) {
        right_.push(chunks_[i + 1])
        i++
      } else {
        right_.push({ value: '' })
      }
    } else {
      left_.push(chunk)
      right_.push(chunk)
    }
  }

  chunks.value = chunks_
  leftChunks.value = left_
  rightChunks.value = right_
}

function getBackgroundColor(chunkA?: Change, chunkB?: Change): string {
  if ((chunkA && !chunkB) || (chunkB && !chunkA)) {
    return '#d0ffa3'
  }
  if ((chunkA?.added || chunkA?.removed) && (chunkB?.removed || chunkB?.added)) {
    return '#bdddff'
  }
  if (chunkA?.added || chunkA?.removed) {
    return '#d0ffa3'
  }
  return ''
}

function getBackgroundPattern(chunkA?: Change, chunkB?: Change): string {
  const color = getBackgroundColor(chunkA, chunkB)
  if (color === '#bdddff') {
    return 'repeating-linear-gradient( -45deg, #96c9ff, #96c9ff 2px, #bdddff 2px, #bdddff 10px )'
  }
  return 'inherit'
}

function prefix(chunk: Change): string {
  if (chunk.added) {
    return '+\n'.repeat(chunk.count || 1)
  } else if (chunk.removed) {
    return '-\n'.repeat(chunk.count || 1)
  } else {
    return ' \n'.repeat(chunk.count || 1)
  }
}

init()
</script>

<template>
  <div v-for="(item, index) in leftChunks" class="row">
    <div
      class="col-sm-6 p-0"
      :style="{ background: getBackgroundPattern(item, rightChunks[index]) }"
    >
      <pre
        class="m-0"
        style="width: 10px; float: left"
        :style="{ backgroundColor: getBackgroundColor(item, rightChunks[index]) }"
        >{{ prefix(item) }}</pre
      >
      <pre
        class="m-0"
        style="overflow: hidden"
        :style="{ backgroundColor: getBackgroundColor(item, rightChunks[index]) }"
        >{{ item.value }}</pre
      >
    </div>
    <div
      class="col-sm-6 p-0"
      :style="{ background: getBackgroundPattern(rightChunks[index], item) }"
    >
      <pre
        class="m-0"
        style="width: 10px; float: left"
        :style="{ backgroundColor: getBackgroundColor(rightChunks[index], item) }"
        >{{ prefix(rightChunks[index]) }}</pre
      >
      <pre
        class="m-0"
        style="overflow: hidden"
        :style="{ backgroundColor: getBackgroundColor(rightChunks[index], item) }"
        >{{ rightChunks[index].value }}</pre
      >
    </div>
  </div>
</template>
