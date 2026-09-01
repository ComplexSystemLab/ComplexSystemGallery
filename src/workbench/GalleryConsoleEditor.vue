<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import type { EditorRenderContext } from "main-ui/core";
import { ConsoleView } from "@main-ui/view-console";
import type { ConsoleEntry } from "@main-ui/view-console";

defineOptions({
  name: "GalleryConsoleEditor",
});

defineProps<{
  context: EditorRenderContext;
}>();

const entries = ref<ConsoleEntry[]>([]);
let nextId = 1;

function addEntry(level: ConsoleEntry["level"], message: string): void {
  entries.value.push({
    id: `log-${nextId++}`,
    level,
    message,
    timestamp: Date.now(),
  });
}

function handleClear(): void {
  entries.value = [];
}

function handleGalleryEvent(event: Event): void {
  const custom = event as CustomEvent<{ path?: string }>;
  addEntry("info", `导航到项目: ${custom.detail?.path ?? "未知"}`);
}

function handleRefreshTree(): void {
  addEntry("info", "刷新项目树…");
}

function handleGoHome(): void {
  addEntry("info", "回到总览");
}

onMounted(() => {
  addEntry("success", "Gallery Console 已启动");
  addEntry("info", `已注册 ${entries.value.length} 条初始化日志`);

  window.addEventListener("gallery:navigate", handleGalleryEvent);
  window.addEventListener("gallery:refresh-tree", handleRefreshTree);
  window.addEventListener("gallery:go-home", handleGoHome);
});

onBeforeUnmount(() => {
  window.removeEventListener("gallery:navigate", handleGalleryEvent);
  window.removeEventListener("gallery:refresh-tree", handleRefreshTree);
  window.removeEventListener("gallery:go-home", handleGoHome);
});
</script>

<template>
  <div class="gallery-console-editor">
    <ConsoleView
      :entries="entries"
      :clear-enabled="true"
      @clear-intent="handleClear"
    />
  </div>
</template>

<style scoped>
.gallery-console-editor {
  width: 100%;
  height: 100%;
}
</style>
