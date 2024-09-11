<script setup lang="ts">
import { computed, ref } from 'vue'

import Home from './views/Home.vue'
import File from './views/File.vue'
import Directory from './views/Directory.vue'
import { ComparisonType, HistoryElement, appState } from './store'
import { getCommonPathLength } from './pathutil'
import { Equivalent } from './components/DirectoryListing.vue'

// Tab definition for files and directories
type Tab = {
  type: ComparisonType | 'home'
  name: string
  left?: string
  right?: string
  mtime?: number
  equivalents: Equivalent[]
}

// Start with the home tab open by default
const activeTab = ref(0)

// List of tabs shown by the app
const tabs = ref([{ type: 'home', name: 'Home' }] as Tab[])

// Add file watcher if a file was given
function addWatcher(filePath?: string): void {
  if (filePath) {
    window.ipcRenderer.invoke('watchFile', filePath)
  }
}

// Remove file watcher if a file was given
function removeWatcher(filePath?: string): void {
  if (filePath) {
    window.ipcRenderer.invoke('unwatchFile', filePath)
  }
}

// Start a new file comparison, optionally adding it to the history of comparisons
function startFileComparison(
  equivalents: Equivalent[],
  left?: string,
  right?: string,
  addToHistory?: boolean
) {
  tabs.value.push({
    type: 'file',
    name: 'No files selected',
    left: left,
    right: right,
    equivalents: equivalents
  })
  activeTab.value = tabs.value.length - 1
  if (left || right) {
    updateElementTitle(tabs.value[activeTab.value])
  }
  addWatcher(left)
  addWatcher(right)
  if (left && right && addToHistory) {
    updateHistory({ type: 'file', left: left, right: right })
  }
}

// Start a new directory comparison, optionally adding it to the history of comparisons
function startDirectoryComparison(
  equivalents: Equivalent[],
  left?: string,
  right?: string,
  addToHistory?: boolean
) {
  tabs.value.push({
    type: 'directory',
    name: 'No directories selected',
    left: left,
    right: right,
    equivalents: equivalents
  })
  activeTab.value = tabs.value.length - 1
  if (left || right) {
    updateElementTitle(tabs.value[activeTab.value])
  }
  if (left && right && addToHistory) {
    updateHistory({ type: 'directory', left: left, right: right })
  }
}

// Close the tab at the given index
function closeTab(index: number) {
  if (index === 0) {
    return
  }
  if (tabs.value[index].type === 'file') {
    removeWatcher(tabs.value[index].left)
    removeWatcher(tabs.value[index].right)
  }
  tabs.value.splice(index, 1)
  if (index === activeTab.value) {
    activeTab.value = activeTab.value - 1
  }
}

function updateElementTitle(element: Tab) {
  let title: string
  if (element.left && element.right) {
    const commonPathLength = getCommonPathLength(element.left, element.right)
    title =
      element.left.substring(commonPathLength) + ' - ' + element.right.substring(commonPathLength)
  } else if (element.left) {
    title = element.left + ' - '
  } else if (element.right) {
    title = ' - ' + element.right
  } else {
    title = 'No ' + element.type + ' selected'
  }
  element.name = title
  // Artificially use the current timestamp. When an updated mtime occurces it should be in the
  // future (or at least different, hence it causes a re-render of the File component)
  element.mtime = new Date().getTime()
  document.title = 'Meld (Electron) - ' + element.name
}

// Switch to the tab at the given index
function switchTab(index: number) {
  activeTab.value = index
  document.title = 'Meld (Electron) - ' + tabs.value[index].name
}
switchTab(0)

const settingsModal = ref(false)
const state = appState()

const fontSize = computed(() => state.value.fontSize)

// When a file is changed in the main process we update the tab's mtime to force a re-render
window.ipcRenderer.on('file-changed', (_event, filename: string, mtime, event_) => {
  for (const tab of tabs.value) {
    if (tab.left === filename || tab.right === filename) {
      tab.mtime = Math.max(tab.mtime || 0, mtime)
    }
  }
})

// Push an element to the history (or move it to the top if it was already present in the history)
function updateHistory(newElement: HistoryElement) {
  for (let i = 0; i < state.value.history.length; i++) {
    const element = state.value.history[i]
    if (
      element.type == newElement.type &&
      ((element.left == newElement.left && element.right == newElement.right) ||
        (element.left == newElement.right && element.right == newElement.left))
    ) {
      state.value.history.splice(i, 1)
      break
    }
  }
  state.value.history.push(newElement)
  while (state.value.history.length > 12) {
    state.value.history.shift()
  }
}
</script>

<template>
  <div class="row">
    <BNav card-header tabs id="tabs">
      <BNavItem
        v-for="(element, index) of tabs"
        :active="activeTab === index"
        @click="switchTab(index)"
        @click.middle="closeTab(index)"
      >
        <IBiFolderFill v-if="element.type === 'directory'" />
        <IBiFileEarmark v-if="element.type === 'file'" />
        <IBiHouse v-if="element.type === 'home'" />
        {{ element.name }}
        <BButton
          @click="closeTab(index)"
          v-if="element.type !== 'home'"
          size="sm"
          style="padding: 0"
        >
          <IBiXLg />
        </BButton>
      </BNavItem>
    </BNav>
  </div>
  <BButton
    style="position: absolute; right: 5px; top: 5px"
    @click="settingsModal = !settingsModal"
    size="sm"
    title="Application settings"
  >
    <IBiGearFill />
  </BButton>
  <BModal v-model="settingsModal" title="Settings" ok-only size="xl" scrollable>
    <BRow style="font-weight: bold">General </BRow>
    <BFormGroup label-cols="3" label="Font size" label-for="settings_fontSize" class="mb-3">
      <BFormInput id="settings_fontSize" v-model="state.fontSize" />
    </BFormGroup>
    <BRow style="font-weight: bold">Directory </BRow>
    <BFormCheckbox v-model="state.directory.ignoreIdentical"> Ignore identical files</BFormCheckbox>
    <BFormGroup
      v-for="(filter, key) of state.directory.filenameFilters"
      label-cols="3"
      :label="key"
      class="mb-3"
    >
      <div class="row">
        <div class="col-sm-8">
          <BInput v-model="filter.pattern[index]" v-for="(pattern, index) in filter.pattern" />
        </div>
        <div class="col-sm-4">
          <BFormCheckbox v-model="filter.enabled">Enabled</BFormCheckbox>
        </div>
      </div>
    </BFormGroup>
    <BRow>
      <BCol sm="3"><BInput /></BCol>
      <BCol sm="9">
        <div class="row">
          <div class="col-sm-8">
            <BInput />
          </div>
          <div class="col-sm-4">
            <BFormCheckbox>Enabled</BFormCheckbox>
          </div>
        </div>
      </BCol>
    </BRow>
  </BModal>
  <div id="pages">
    <div v-for="(element, index) of tabs">
      <Home
        v-if="element.type === 'home' && activeTab === index"
        :start-file-comparison="startFileComparison"
        :start-directory-comparison="startDirectoryComparison"
      />
      <File
        v-if="element.type === 'file' && activeTab === index"
        :left="element.left"
        :right="element.right"
        :equivalents="element.equivalents"
        :files-selected="
          (left, right) => {
            removeWatcher(element.left)
            removeWatcher(element.right)
            element.left = left
            element.right = right
            updateElementTitle(element)
            if (left && right) {
              updateHistory({ type: 'file', left: left, right: right })
            }
          }
        "
        :key="(element.left || '') + element.right + element.mtime"
      />
      <Directory
        v-if="element.type === 'directory' && activeTab === index"
        :left="element.left"
        :right="element.right"
        :equivalents="element.equivalents"
        :start-file-comparison="
          (equivalents: Equivalent[], left: string, right: string) => {
            startFileComparison(equivalents, left, right)
          }
        "
        :start-directory-comparison="
          (equivalents: Equivalent[], left: string, right: string) => {
            startDirectoryComparison(equivalents, left, right)
          }
        "
        :directories-selected="
          (left, right) => {
            element.left = left
            element.right = right
            updateElementTitle(element)
            if (left && right) {
              updateHistory({ type: 'directory', left: left, right: right })
            }
          }
        "
      />
    </div>
  </div>
</template>

<style>
ul.nav {
  background-color: var(--bs-secondary-bg);
}
ul.nav .nav-link {
  background-color: rgba(255, 255, 255, 0.5);
  color: black;
}
ul.nav .nav-link.active {
  background-color: white;
}
input.form-control,
span,
div,
button.btn {
  font-size: v-bind('fontSize');
}
</style>
