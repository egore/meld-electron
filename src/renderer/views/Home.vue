<script lang="ts" setup>
defineProps<{ startFileComparison: () => void; startDirectoryComparison: () => void }>()
</script>

<template>
  <div class="row justify-content-md-center">
    <div class="col-sm-2 h1">
      <BCard tag="article">
        <BCardText style="text-align: center">
          <IBiFileEarmarkPlus />
        </BCardText>

        <BButton @click="startFileComparison()">New file comparison</BButton>
      </BCard>
    </div>
    <div class="col-sm-2 h1">
      <BCard tag="article">
        <BCardText style="text-align: center">
          <IBiFolderPlus />
        </BCardText>

        <BButton @click="startDirectoryComparison()">New directory comparison</BButton>
      </BCard>
    </div>
  </div>
</template>
