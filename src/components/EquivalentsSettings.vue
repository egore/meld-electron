<script lang="ts" setup>
import { ref } from 'vue'

export type Equivalent = {
  left: string
  right: string
}

defineProps<{
  equivalents: Equivalent[]
}>()

defineEmits(['ok'])

const settingsEquivalents = ref(false)
</script>

<template>
  <BButton
    @click="settingsEquivalents = true"
    style="position: absolute; top: 5px; right: 45px"
    size="sm"
    title="Equivalents"
  >
    <IBiArrowsCollapseVertical />
  </BButton>
  <BModal
    v-model="settingsEquivalents"
    title="Equivalents"
    ok-only
    size="xl"
    scrollable
    @ok="$emit('ok')"
  >
    <BTableSimple>
      <BTbody>
        <BTr v-for="equivalent in equivalents">
          <BTd><BFormInput v-model="equivalent.left" /></BTd>
          <BTd><BFormInput v-model="equivalent.right" /></BTd>
          <BTd
            ><BButton @click="equivalents.splice(equivalents.indexOf(equivalent), 1)"
              >Delete</BButton
            ></BTd
          >
        </BTr>
        <BTr>
          <BTd colspan="23">
            <BButton @click="equivalents.push({ left: '', right: '' })">Add</BButton>
          </BTd>
        </BTr>
      </BTbody>
    </BTableSimple>
  </BModal>
</template>
