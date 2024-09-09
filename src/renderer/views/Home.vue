<script lang="ts" setup>
defineProps<{ startFileComparison: () => void; startDirectoryComparison: () => void }>()
</script>

<template>
  <div class="row justify-content-sm-center" style="margin-top: 5rem">
    <div class="col-sm-4 col-md-3 col-lg-2 h1">
      <BCard tag="article">
        <BCardText style="text-align: center">
          <IBiFileEarmarkPlus />
        </BCardText>

        <BButton style="width: 100%" @click="startFileComparison()">New file comparison</BButton>
      </BCard>
    </div>
    <div class="col-sm-4 col-md-3 col-lg-2 h1">
      <BCard tag="article">
        <BCardText style="text-align: center">
          <IBiFolderPlus />
        </BCardText>

        <BButton style="width: 100%" @click="startDirectoryComparison()"
          >New directory comparison</BButton
        >
      </BCard>
    </div>
  </div>
</template>
