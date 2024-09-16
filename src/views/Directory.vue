<script lang="ts" setup>
import { computed, ref, Ref } from 'vue'
import DirectoryListing from '../components/DirectoryListing.vue'
import { appState } from '../store'
import EquivalentsSettings, { Equivalent } from '../components/EquivalentsSettings.vue'

const props = defineProps<{
  left?: string
  right?: string
  equivalents: Equivalent[]
  directoriesSelected: (left: string, right: string) => void
  startFileComparison: (equivalents: Equivalent[], left: string, right: string) => void
  startDirectoryComparison: (equivalents: Equivalent[], left: string, right: string) => void
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
  const selectedDirectory = await window.ipcRenderer.invoke('selectDirectory', dir)
  if (!selectedDirectory) {
    return
  }
  directory.value = selectedDirectory

  props.directoriesSelected(leftDirectory.value, rightDirectory.value)
}

const state = appState()

function convertShellPatternToRexExp(shell: string): string {
  return '^' + shell.replace('*', '.*') + '$'
}

const ignorePatterns = computed(() => {
  const result = []
  for (const filter of Object.values(state.value.directory.filenameFilters)) {
    if (filter.enabled) {
      for (const pattern of filter.pattern) {
        result.push(RegExp(convertShellPatternToRexExp(pattern)))
      }
    }
  }
  return result
})

const equivalentsKey = computed(() => {
  let len = 0
  for (const e of props.equivalents) {
    len += e.left.length + e.right.length
  }
  return len
})
</script>

<template>
  <EquivalentsSettings
    @ok="directoriesSelected(leftDirectory, rightDirectory)"
    :equivalents="equivalents"
  />
  <div class="row">
    <div class="col-sm-6 p-0">
      <BInputGroup>
        <BInput
          disabled
          :model-value="leftDirectory"
          placeholder="Please select left directory"
        ></BInput>
        <template #append>
          <BButton variant="outline-secondary" @click="selectLeft">...</BButton>
        </template>
      </BInputGroup>
    </div>
    <div class="col-sm-6 p-0">
      <BInputGroup>
        <BInput
          disabled
          :model-value="rightDirectory"
          placeholder="Please select right directory"
        ></BInput>
        <template #append>
          <BButton variant="outline-secondary" @click="selectRight">...</BButton>
        </template>
      </BInputGroup>
    </div>
  </div>
  <DirectoryListing
    :start-file-comparison="
      (equivalents, left, right) => {
        startFileComparison(equivalents, left, right)
      }
    "
    :start-directory-comparison="
      (equivalents, left, right) => {
        startDirectoryComparison(equivalents, left, right)
      }
    "
    :skip-identical="state.directory.ignoreIdentical"
    v-if="leftDirectory && rightDirectory"
    :left="leftDirectory"
    :right="rightDirectory"
    :key="leftDirectory + rightDirectory + state.directory.ignoreIdentical + equivalentsKey"
    :ignore-patterns="ignorePatterns"
    :equivalents="equivalents"
  />
</template>
