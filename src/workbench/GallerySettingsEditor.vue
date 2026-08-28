<script setup lang="ts">
import type { EditorRenderContext } from "main-ui/core";
import { SettingsEditor } from "main-ui/vue";

defineOptions({
  name: "GallerySettingsEditor",
});

defineProps<{
  context: EditorRenderContext;
}>();
</script>

<template>
  <div class="gallery-settings-editor">
    <SettingsEditor :workspace-id="context.workspaceId" />
  </div>
</template>

<style scoped>
.gallery-settings-editor {
  width: 100%;
  height: 100%;
  overflow: auto;
}
</style>
