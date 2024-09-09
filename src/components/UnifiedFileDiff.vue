<script setup lang="ts">
import { ref } from 'vue'
import { diffLines, Change } from 'diff'

const props = defineProps<{
  left: string
  right: string
}>()

const chunks = ref([] as Change[])

async function init() {
  const leftText = await window.ipcRenderer.invoke('loadFile', props.left)
  const rightText = await window.ipcRenderer.invoke('loadFile', props.right)
  const chunks_ = diffLines(leftText, rightText)

  chunks.value = chunks_
}

function getBackgroundColor(chunk: Change): string {
  if (chunk.added) {
    return '#d0ffa3'
  }
  if (chunk.removed) {
    return '#ffb4b4'
  }
  return ''
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
  <div v-for="chunk in chunks" class="row">
    <div class="col-sm-12" :style="{ backgroundColor: getBackgroundColor(chunk) }">
      <pre class="m-0" style="width: 10px; float: left">{{ prefix(chunk) }}</pre>
      <pre class="m-0">{{ chunk.value }}</pre>
    </div>
  </div>
</template>
