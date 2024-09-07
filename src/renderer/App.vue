<script setup lang="ts">
import { ref } from 'vue'

import Home from './views/Home.vue'
import File from './views/File.vue'
import Directory from './views/Directory.vue'

window.electronAPI.sendMessage('Meld (Electron) has started')

const activeTab = ref(0)

const tabs = ref([{ type: 'Home', name: 'Home' }] as {
  type: string
  name: string
  left?: string
  right?: string
}[])

function startFileComparison(left?: string, right?: string) {
  tabs.value.push({
    type: 'File',
    name: 'No files selected',
    left: left,
    right: right
  })
  activeTab.value = tabs.value.length - 1
  if (left || right) {
    updateElementTitle(tabs.value[activeTab.value])
  }
}

function startDirectoryComparison(left?: string, right?: string) {
  tabs.value.push({
    type: 'Directory',
    name: 'No directories selected',
    left: left,
    right: right
  })
  activeTab.value = tabs.value.length - 1
  if (left || right) {
    updateElementTitle(tabs.value[activeTab.value])
  }
}

function closeTab(index: number) {
  if (index === 0) {
    return
  }
  tabs.value.splice(index, 1)
  if (index === activeTab.value) {
    activeTab.value = activeTab.value - 1
  }
}

function getCommonPathLength(left: string, right: string): number {
  let i
  for (i = 0; i < Math.min(left.lastIndexOf('/') + 1, right.lastIndexOf('/') + 1); i++) {
    const leftChar = left[i]
    const rightChar = right[i]
    if (leftChar !== rightChar) {
      break
    }
  }
  return i
}

function updateElementTitle(element: {
  name: string
  type: string
  left?: string
  right?: string
}) {
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
  document.title = 'Meld (Electron) - ' + element.name
}
function switchTab(index: number) {
  activeTab.value = index
  document.title = 'Meld (Electron) - ' + tabs.value[index].name
}
switchTab(0)
</script>

<template>
  <BNav card-header tabs id="tabs">
    <BNavItem
      v-for="(element, index) of tabs"
      :active="activeTab === index"
      @click="switchTab(index)"
      @click.middle="closeTab(index)"
    >
      <IBiFolderFill v-if="element.type === 'Directory'" />
      <IBiFileEarmark v-if="element.type === 'File'" />
      <IBiHouse v-if="element.type === 'Home'" />
      {{ element.name }}
      <BButton @click="closeTab(index)" v-if="element.type !== 'Home'" size="sm">
        <IBiXLg />
      </BButton>
    </BNavItem>
  </BNav>
  <div id="pages">
    <div v-for="(element, index) of tabs">
      <Home
        v-if="element.type === 'Home' && activeTab === index"
        :start-file-comparison="startFileComparison"
        :start-directory-comparison="startDirectoryComparison"
      />
      <File
        v-if="element.type === 'File' && activeTab === index"
        :left="element.left"
        :right="element.right"
        :files-selected="
          (left, right) => {
            element.left = left
            element.right = right
            updateElementTitle(element)
          }
        "
      />
      <Directory
        v-if="element.type === 'Directory' && activeTab === index"
        :left="element.left"
        :right="element.right"
        :show-file-diff="
          (left, right) => {
            startFileComparison(left, right)
          }
        "
        :directories-selected="
          (left, right) => {
            element.left = left
            element.right = right
            updateElementTitle(element)
          }
        "
      />
    </div>
  </div>
</template>
