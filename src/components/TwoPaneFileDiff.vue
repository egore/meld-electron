<script setup lang="ts">
import { ref, computed } from 'vue'
import { diffLines, Change } from 'diff'

import { appState } from '../store'
import { Equivalent } from './DirectoryListing.vue'

const state = appState()

const fontSize = computed(() => state.value.fontSize)
const svgViewBox = computed(() => {
  const size = state.value.fontSize.split('px')[0]
  return `0 0 ${size} ${size}`
})

const props = defineProps<{
  left: string
  right: string
  equivalents: Equivalent[]
}>()

const leftFile = ref(props.left)
const rightFile = ref(props.right)

const chunks = ref([] as Change[])
const leftChunks = ref([] as Change[])
const rightChunks = ref([] as Change[])
const identical = ref(0)

let leftText = ''
let rightText = ''

interface EuiqvChange extends Change {
  equived?: boolean
}

async function init() {
  leftText = (await window.ipcRenderer.invoke('loadFile', leftFile.value)) as string
  rightText = (await window.ipcRenderer.invoke('loadFile', rightFile.value)) as string

  let leftTextForDiff = leftText
  let rightTextForDiff = rightText
  for (let i = 0; i < props.equivalents.length; i++) {
    const eq = props.equivalents[i]
    leftTextForDiff = leftTextForDiff.replaceAll(eq.left, `[equivalent_${i}]`)
    rightTextForDiff = rightTextForDiff.replaceAll(eq.right, `[equivalent_${i}]`)
  }

  const chunks_ = diffLines(leftTextForDiff, rightTextForDiff)

  const left_: EuiqvChange[] = []
  const right_: EuiqvChange[] = []
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
      right_.push({ ...chunk })
    }
  }

  for (let i = 0; i < props.equivalents.length; i++) {
    for (const chunk of left_) {
      const newValue = chunk.value.replaceAll(`[equivalent_${i}]`, props.equivalents[i].left)
      if (chunk.value != newValue) {
        chunk.equived = true
      }
      chunk.value = newValue
    }
    for (const chunk of right_) {
      const newValue = chunk.value.replaceAll(`[equivalent_${i}]`, props.equivalents[i].right)
      if (chunk.value != newValue) {
        chunk.equived = true
      }
      chunk.value = newValue
    }
  }

  identical.value = left_.length === 1 && right_.length === 1 ? 2500 : 0

  chunks.value = chunks_
  leftChunks.value = left_
  rightChunks.value = right_
}

function getBackgroundColor(chunkA?: EuiqvChange, chunkB?: EuiqvChange): string {
  if ((chunkA && !chunkB) || (chunkB && !chunkA)) {
    return '#d0ffa3'
  }
  if ((chunkA?.added || chunkA?.removed) && (chunkB?.removed || chunkB?.added)) {
    return '#bdddff'
  }
  if (chunkA?.added || chunkA?.removed) {
    return '#d0ffa3'
  }
  if (chunkA?.equived || chunkB?.equived) {
    return '#f8f8f8'
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

function onScroll(index: number, origin: 'left' | 'right'): void {
  const left = document.getElementById(`left-chunk-${index}`) as HTMLElement
  const right = document.getElementById(`right-chunk-${index}`) as HTMLElement
  if (origin === 'right') {
    left.scrollLeft = right.scrollLeft
  } else {
    right.scrollLeft = left.scrollLeft
  }
}

function removeChunk(index: number, pane: 'left' | 'right'): void {
  if (pane === 'left') {
    leftChunks.value.splice(index, 1)
    if (!rightChunks.value[index].added && !rightChunks.value[index].removed) {
      rightChunks.value.splice(index, 1)
    }
  } else {
    rightChunks.value.splice(index, 1)
    if (!leftChunks.value[index].added && !leftChunks.value[index].removed) {
      leftChunks.value.splice(index, 1)
    }
  }
}

function replaceChunk(index: number, pane: 'left' | 'right'): void {
  if (pane === 'left') {
    leftChunks.value[index].value = rightChunks.value[index].value
  } else {
    rightChunks.value[index].value = leftChunks.value[index].value
  }
  leftChunks.value[index].added = false
  leftChunks.value[index].removed = false
  rightChunks.value[index].added = false
  rightChunks.value[index].removed = false
}
init()
</script>

<template>
  <Teleport to="body">
    <div class="bottom-0 end-0 toast-container position-fixed p-3">
      <BToast v-model="identical" variant="info"> The content of the files is identical </BToast>
    </div>
  </Teleport>
  <div v-for="(leftChunk, index) in leftChunks" class="row">
    <div
      class="col-sm-6 p-0"
      :style="{ background: getBackgroundPattern(leftChunk, rightChunks[index]) }"
      style="width: calc(50% - 20px)"
    >
      <pre
        class="m-0"
        style="width: 10px; float: left"
        :style="{ backgroundColor: getBackgroundColor(leftChunk, rightChunks[index]) }"
        >{{ prefix(leftChunk) }}</pre
      >
      <pre
        class="m-0"
        :id="`left-chunk-${index}`"
        @scroll="onScroll(index, 'left')"
        style="overflow-y: scroll"
        :style="{ backgroundColor: getBackgroundColor(leftChunk, rightChunks[index]) }"
        >{{ leftChunk.value }}</pre
      >
    </div>
    <div
      style="width: 40px; padding: 0; text-align: center"
      :style="{
        height: fontSize
      }"
    >
      <span
        class="action"
        v-if="leftChunk.removed && !rightChunks[index].added"
        @click="removeChunk(index, 'left')"
        title="Delete chunk on the left"
      >
        <IBiArrowLeft :viewBox="svgViewBox" :width="fontSize" :height="fontSize" />
      </span>
      <span
        class="action"
        v-if="leftChunk.removed && !rightChunks[index].added"
        @click="replaceChunk(index, 'right')"
        title="Insert chunk to the right"
      >
        <IBiArrowRight :viewBox="svgViewBox" :width="fontSize" :height="fontSize" />
      </span>
      <span
        class="action"
        v-if="!leftChunk.removed && rightChunks[index].added"
        @click="replaceChunk(index, 'left')"
        title="Insert chunk to the left"
      >
        <IBiArrowLeft :viewBox="svgViewBox" :width="fontSize" :height="fontSize" />
      </span>
      <span
        class="action"
        v-if="!leftChunk.removed && rightChunks[index].added"
        @click="removeChunk(index, 'right')"
        title="Delete chunk on the right"
      >
        <IBiArrowRight :viewBox="svgViewBox" :width="fontSize" :height="fontSize" />
      </span>
      <span
        class="action"
        v-if="leftChunk.removed && rightChunks[index].added"
        @click="replaceChunk(index, 'left')"
        title="Replace chunk on the left with content from the right"
      >
        <IBiArrowLeft :viewBox="svgViewBox" :width="fontSize" :height="fontSize" />
      </span>
      <span
        class="action"
        v-if="leftChunk.removed && rightChunks[index].added"
        @click="replaceChunk(index, 'right')"
        title="Replace chunk on the right with content from the left"
      >
        <IBiArrowRight :viewBox="svgViewBox" :width="fontSize" :height="fontSize" />
      </span>
    </div>
    <div
      class="col-sm-6 p-0"
      :style="{ background: getBackgroundPattern(rightChunks[index], leftChunk) }"
      style="width: calc(50% - 20px)"
    >
      <pre
        class="m-0"
        style="width: 10px; float: left"
        :style="{ backgroundColor: getBackgroundColor(rightChunks[index], leftChunk) }"
        >{{ prefix(rightChunks[index]) }}</pre
      >
      <pre
        class="m-0"
        :id="`right-chunk-${index}`"
        @scroll="onScroll(index, 'right')"
        style="overflow-y: scroll"
        :style="{ backgroundColor: getBackgroundColor(rightChunks[index], leftChunk) }"
        >{{ rightChunks[index].value }}</pre
      >
    </div>
  </div>
</template>

<style scope>
.action {
  cursor: pointer;
  height: v-bind('fontSize');
  display: inline-block;
  position: relative;
  left: -2px;
  top: -3px;
}
</style>
