<script lang="ts" setup>
import { ref, Ref } from 'vue'
import TwoPaneFileDiff from '../components/TwoPaneFileDiff.vue'
import UnifiedFileDiff from '../components/UnifiedFileDiff.vue'
import { Equivalent } from '../components/DirectoryListing.vue'

const props = defineProps<{
  left?: string
  right?: string
  equivalents: Equivalent[]
  filesSelected: (left: string, right: string) => void
}>()

const leftFilename = ref(props.left || '')
const rightFilename = ref(props.right || '')

const unified = ref(false)

async function selectLeft() {
  selectFile(leftFilename)
}

async function selectRight() {
  selectFile(rightFilename)
}

async function selectFile(filename: Ref<string, string>) {
  const lastSlash = filename.value.lastIndexOf('/')
  let dir: string | undefined = undefined
  if (lastSlash !== -1) {
    dir = filename.value.slice(0, lastSlash)
  }
  const selectedFile: string = await window.ipcRenderer.invoke('selectFile', dir)
  if (!selectedFile) {
    return
  }
  filename.value = selectedFile

  props.filesSelected(leftFilename.value, rightFilename.value)
}
</script>

<template>
  {{ equivalents }}
  <BButton
    @click="unified = !unified"
    style="position: absolute; top: 5px; right: 45px"
    size="sm"
    title="Equivalents"
  >
    {{ unified ? 'Two Pane' : 'Unified' }}
  </BButton>
  <div class="row">
    <div class="col-sm-6 p-0">
      <BInputGroup>
        <BInput disabled :model-value="leftFilename" placeholder="Please select left file"></BInput>
        <template #append>
          <BButton variant="outline-secondary" @click="selectLeft">...</BButton>
        </template>
      </BInputGroup>
    </div>
    <div class="col-sm-6 p-0">
      <BInputGroup>
        <BInput
          disabled
          :model-value="rightFilename"
          placeholder="Please select right file"
        ></BInput>
        <template #append>
          <BButton variant="outline-secondary" @click="selectRight">...</BButton>
        </template>
      </BInputGroup>
    </div>
  </div>
  <UnifiedFileDiff
    v-if="unified && leftFilename && rightFilename"
    :left="leftFilename"
    :right="rightFilename"
    :equivalents="equivalents"
    :key="leftFilename + rightFilename"
  />
  <TwoPaneFileDiff
    v-if="!unified && leftFilename && rightFilename"
    :left="leftFilename"
    :right="rightFilename"
    :equivalents="equivalents"
    :key="leftFilename + rightFilename"
  />
</template>
