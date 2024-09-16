<script lang="ts" setup>
import { computed, ref, Ref } from 'vue'
import TwoPaneFileDiff from '../components/TwoPaneFileDiff.vue'
import UnifiedFileDiff from '../components/UnifiedFileDiff.vue'
import { Equivalent } from '../components/EquivalentsSettings.vue'

const props = defineProps<{
  left?: string
  right?: string
  equivalents: Equivalent[]
  filesSelected: (left: string, right: string) => void
}>()

const leftFile = ref(props.left || '')
const rightFile = ref(props.right || '')

const unified = ref(false)

async function selectLeft() {
  selectFile(leftFile)
}

async function selectRight() {
  selectFile(rightFile)
}

async function selectFile(file: Ref<string, string>) {
  const lastSlash = file.value.lastIndexOf('/')
  let dir: string | undefined = undefined
  if (lastSlash !== -1) {
    dir = file.value.slice(0, lastSlash)
  }
  const selectedFile: string = await window.ipcRenderer.invoke('selectFile', dir)
  if (!selectedFile) {
    return
  }
  file.value = selectedFile

  props.filesSelected(leftFile.value, rightFile.value)
}

const equivalentsKey = computed(() => {
  let len = 0
  for (const e of props.equivalents) {
    len += e.left.length + e.right.length
  }
  return len
})
</script>

<template>
  <EquivalentsSettings @ok="filesSelected(leftFile, rightFile)" :equivalents="equivalents" />
  <BButton
    @click="unified = !unified"
    style="position: absolute; top: 5px; right: 85px"
    size="sm"
    title="Equivalents"
  >
    {{ unified ? 'Two Pane' : 'Unified' }}
  </BButton>
  <div class="row">
    <div class="col-sm-6 p-0">
      <BInputGroup>
        <BInput disabled :model-value="leftFile" placeholder="Please select left file"></BInput>
        <template #append>
          <BButton variant="outline-secondary" @click="selectLeft">...</BButton>
        </template>
      </BInputGroup>
    </div>
    <div class="col-sm-6 p-0">
      <BInputGroup>
        <BInput disabled :model-value="rightFile" placeholder="Please select right file"></BInput>
        <template #append>
          <BButton variant="outline-secondary" @click="selectRight">...</BButton>
        </template>
      </BInputGroup>
    </div>
  </div>
  <UnifiedFileDiff
    v-if="unified && leftFile && rightFile"
    :left="leftFile"
    :right="rightFile"
    :equivalents="equivalents"
    :key="leftFile + rightFile + equivalentsKey"
  />
  <TwoPaneFileDiff
    v-if="!unified && leftFile && rightFile"
    :left="leftFile"
    :right="rightFile"
    :equivalents="equivalents"
    :key="leftFile + rightFile + equivalentsKey"
  />
</template>
