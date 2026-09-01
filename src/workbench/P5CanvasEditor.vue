<script setup lang="ts">
import { shallowRef } from "vue";
import type { EditorRenderContext } from "main-ui/core";
import { HostEngineView } from "@main-ui/view-host-engine";
import { createP5NetworkEngine } from "../engines/p5EngineAdapter";

defineOptions({
  name: "P5CanvasEditor",
});

defineProps<{
  context: EditorRenderContext;
}>();

/**
 * p5 网络粒子引擎实例。
 *
 * 使用 `shallowRef` 持有引擎引用，避免 Vue 深度代理 p5 内部对象。
 * 引擎在 `HostEngineView` 的 `mount` 回调中延迟创建。
 */
const engine = shallowRef(createP5NetworkEngine(60));
</script>

<template>
  <div class="p5-canvas-editor">
    <HostEngineView :engine="engine" />
  </div>
</template>

<style scoped>
.p5-canvas-editor {
  width: 100%;
  height: 100%;
}
</style>
