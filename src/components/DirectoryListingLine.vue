<script lang="ts" setup>
import { computed } from 'vue'
import { format } from 'date-fns'
import { Equivalent } from './EquivalentsSettings.vue'
import { appState } from '../store'
import { ComparisonStarterFunction } from '../types'

const props = defineProps<{
  position: 'left' | 'right'
  pair: { left: FileInfo; right: FileInfo }
  dirs: { left: string; right: string }
  equivalents: Equivalent[]
  startFileComparison: ComparisonStarterFunction
  startDirectoryComparison: ComparisonStarterFunction
  reload: () => Promise<void>
  copyFile: (left: string, right: string) => Promise<void>
  deleteDirectory: (dirPath: string) => Promise<void>
  deleteFile: (filePath: string) => Promise<void>
}>()

const otherPosition = props.position === 'left' ? 'right' : 'left'

const state = appState()

function join(...elements: string[]): string {
  return elements.map((element, index) => `${index === 0 ? '' : '/'}${element}`).join('')
}

function getStyle(fileA: FileInfo, fileB: FileInfo, origin: 'left' | 'right') {
  if (fileA.type === 'dummy') {
    return { color: 'lightgray', 'text-decoration': 'line-through' }
  }
  if (fileA.name && fileB.type === 'dummy') {
    return { color: origin === 'left' ? '#bf0000' : '#219a32' }
  }
  if (fileA.name != fileB.name) {
    if (origin === 'left' && fileA.name === fileB.equivalentName) {
      return { color: '#bf0000' }
    }
    if (origin === 'right' && fileA.equivalentName === fileB.name) {
      return { color: '#219a32' }
    }
  }
  if (fileB.name && fileA.sha1sum !== fileB.sha1sum) {
    return { color: '#3370e5' }
  }
  return {}
}

const enableTree = computed(() => {
  return state.value.directory.enableTree
})
</script>

<template>
  <div
    class="row flex-row flex-nowrap"
    :style="getStyle(pair[position], pair[otherPosition], position)"
  >
    <span class="col-sm-1 oneline" style="width: 36px; padding-left: 1px">
      <a
        v-if="
          enableTree &&
          pair.left.numChildren &&
          pair.left.type === 'directory' &&
          pair.right.type === 'directory'
        "
        data-bs-toggle="collapse"
        aria-expanded="false"
        :href="`#collapse${pair.left.name}`"
        :aria-controls="`collapse${pair.left.name}`"
        style="color: inherit"
      >
        <IBiCaretRightFill />
      </a>
      <div v-else style="width: 16px; height: 10px; display: inline-block"></div>
      <IBiFileEarmark v-if="pair[position].type === 'file'" />
      <IBiFolderFill v-if="pair[position].type === 'directory'" />
    </span>
    <span class="col-sm-6 p-0 oneline">
      <span
        @dblclick="
          startFileComparison(
            equivalents,
            join(dirs.left, pair.left.name),
            join(dirs.right, pair.right.name)
          )
        "
        style="cursor: pointer"
        v-if="pair.left.type === 'file' && pair.right.type === 'file'"
      >
        <BPopover :click="true" :close-on-hide="true" :delay="{ show: 0, hide: 0 }">
          <template #target>
            <BButton variant="link" style="padding: 0; color: inherit; text-decoration: none">{{
              pair[position].name
            }}</BButton>
          </template>
          <BButton
            size="sm"
            class="ml-2"
            @click="
              startFileComparison(
                equivalents,
                join(dirs.left, pair.left.name),
                join(dirs.right, pair.right.name)
              )
            "
            >Show</BButton
          >
        </BPopover>
      </span>
      <span
        @dblclick="
          startDirectoryComparison(
            equivalents,
            join(dirs.left, pair.left.name),
            join(dirs.right, pair.right.name)
          )
        "
        style="cursor: pointer"
        v-else-if="pair.left.type === 'directory' && pair.right.type === 'directory'"
      >
        <BPopover :click="true" :close-on-hide="true" :delay="{ show: 0, hide: 0 }">
          <template #target>
            <BButton variant="link" style="padding: 0; color: inherit; text-decoration: none">{{
              pair[position].name
            }}</BButton>
          </template>
          <BButton
            size="sm"
            class="ml-2"
            @click="
              startDirectoryComparison(
                equivalents,
                join(dirs.left, pair.left.name),
                join(dirs.right, pair.right.name)
              )
            "
            >Show</BButton
          >
        </BPopover>
      </span>
      <span v-else-if="pair[position].type === 'directory' && pair[otherPosition].type === 'dummy'">
        <BPopover :click="true" :close-on-hide="true" :delay="{ show: 0, hide: 0 }">
          <template #target>
            <BButton variant="link" style="padding: 0; color: inherit; text-decoration: none">{{
              pair[position].name
            }}</BButton>
          </template>
          <BButton
            variant="danger"
            size="sm"
            class="ml-2"
            @click="deleteDirectory(join(dirs[position], pair[position].name))"
            >Delete</BButton
          >
        </BPopover>
      </span>
      <span v-else-if="pair[position].type !== 'file'">
        {{ pair[position].name }}
      </span>
      <span v-else>
        <BPopover :click="true" :close-on-hide="true" :delay="{ show: 0, hide: 0 }">
          <template #target>
            <BButton variant="link" style="padding: 0; color: inherit; text-decoration: none">{{
              pair[position].name
            }}</BButton>
          </template>
          <BButton
            variant="success"
            size="sm"
            class="ml-2"
            @click="
              copyFile(
                join(dirs[position], pair[position].name),
                join(dirs[otherPosition], pair[otherPosition].name)
              )
            "
            >Copy</BButton
          >
          <BButton
            variant="danger"
            size="sm"
            class="ml-2"
            @click="deleteFile(join(dirs[position], pair[position].name))"
            >Delete</BButton
          >
        </BPopover>
      </span>
    </span>
    <span class="col-sm-3 p-0 oneline">{{
      pair[position].dateModified ? format(pair[position].dateModified, 'Pp') : ''
    }}</span>
    <span class="col-sm-2 p-0 oneline"><FileSize :size="pair[position].size"></FileSize></span>
  </div>
</template>
