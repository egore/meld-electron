<script lang="ts" setup>
import { computed } from 'vue'
import { HistoryElement, appState } from '../store'
import { getCommonPathLength } from '../pathutil'
import { Equivalent } from '../components/DirectoryListing.vue'

defineProps<{
  startFileComparison: (
    equivalents: Equivalent[],
    left?: string,
    right?: string,
    addToHistory?: boolean
  ) => void
  startDirectoryComparison: (
    equivalents: Equivalent[],
    left?: string,
    right?: string,
    addToHistory?: boolean
  ) => void
}>()

const state = appState()

type HistoryElementWithCommonPath = {
  common: number
} & HistoryElement

const history = computed(() => {
  const result: HistoryElementWithCommonPath[] = []
  for (const element of state.value.history) {
    const commonPathLength = getCommonPathLength(element.left, element.right)

    result.push({ ...element, common: commonPathLength })
  }
  return result
})

async function init() {
  for (const element of state.value.history) {
    const exist = await window.ipcRenderer.invoke('filesExist', element.left, element.right)
    if (!exist[0] || !exist[1]) {
      state.value.history.splice(state.value.history.indexOf(element), 1)
    }
  }
}
init()
</script>

<template>
  <div class="row justify-content-sm-center" style="margin-top: 5rem">
    <div class="col-sm-4 col-md-3 col-lg-2">
      <BCard tag="article">
        <BCardText style="text-align: center">
          <IBiFileEarmarkPlus style="font-size: 3rem" />
        </BCardText>

        <BButton style="width: 100%" @click="startFileComparison([])">New file comparison</BButton>
      </BCard>
    </div>
    <div class="col-sm-4 col-md-3 col-lg-2">
      <BCard tag="article">
        <BCardText style="text-align: center">
          <IBiFolderPlus style="font-size: 3rem" />
        </BCardText>

        <BButton style="width: 100%" @click="startDirectoryComparison([])"
          >New directory comparison</BButton
        >
      </BCard>
    </div>
  </div>
  <div class="row justify-content-sm-center mt-4">
    <div class="col-sm-10">
      <BCard>
        <div v-for="element in history.slice().reverse()">
          <IBiFolderFill v-if="element.type === 'directory'" />
          <IBiFileEarmark v-if="element.type === 'file'" />
          <span
            v-if="element.type === 'file'"
            @click="
              startFileComparison(element.equivalents || [], element.left, element.right, true)
            "
            style="cursor: pointer"
            >{{ element.left.substring(0, element.common)
            }}{{ element.left.substring(element.common) }} <IBiArrowLeftRight />
            {{ element.right.substring(element.common) }}</span
          >
          <span
            v-if="element.type === 'directory'"
            @click="
              startDirectoryComparison(element.equivalents || [], element.left, element.right, true)
            "
            style="cursor: pointer"
            >{{ element.left.substring(0, element.common)
            }}{{ element.left.substring(element.common) }} <IBiArrowLeftRight />
            {{ element.right.substring(element.common) }}</span
          >
        </div>
      </BCard>
    </div>
  </div>
</template>
