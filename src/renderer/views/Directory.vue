<script lang="ts" setup>
import { ref, Ref } from 'vue'
import DirectoryListing from '../components/DirectoryListing.vue'

const props = defineProps<{
  left?: string
  right?: string
  directoriesSelected: (left: string, right: string) => void
  showFileDiff: (left: string, right: string) => void
}>()

const leftDirectory = ref(props.left || '')
const rightDirectory = ref(props.right || '')

async function selectLeft() {
  selectDirectory(leftDirectory)
}

async function selectRight() {
  selectDirectory(rightDirectory)
}

async function selectDirectory(directory: Ref<string, string>) {
  const lastSlash = directory.value.lastIndexOf('/')
  let dir: string | undefined = undefined
  if (lastSlash !== -1) {
    dir = directory.value.slice(0, lastSlash)
  }
  const selectedDirectory = await window.electronAPI.selectDirectory(dir)
  if (!selectedDirectory) {
    return
  }
  directory.value = selectedDirectory

  props.directoriesSelected(leftDirectory.value, rightDirectory.value)
}
</script>

<template>
  <div class="row">
    <div class="col-sm-6 p-0">
      <BInputGroup>
        <BInput disabled :model-value="leftDirectory"></BInput>
        <template #append>
          <BButton variant="outline-secondary" @click="selectLeft">...</BButton>
        </template>
      </BInputGroup>
    </div>
    <div class="col-sm-6 p-0">
      <BInputGroup>
        <BInput disabled :model-value="rightDirectory"></BInput>
        <template #append>
          <BButton variant="outline-secondary" @click="selectRight">...</BButton>
        </template>
      </BInputGroup>
    </div>
  </div>
  <DirectoryListing
    :show-file-diff="
      (left, right) => {
        showFileDiff(left, right)
      }
    "
    v-if="leftDirectory && rightDirectory"
    :left="leftDirectory"
    :right="rightDirectory"
    :key="leftDirectory + rightDirectory"
  />
</template>
