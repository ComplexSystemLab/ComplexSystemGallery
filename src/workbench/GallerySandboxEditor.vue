<script setup lang="ts">
import { ref } from "vue";
import type { EditorRenderContext } from "main-ui/core";
import { SandboxView } from "@main-ui/view-sandbox";
import type { SandboxDocument } from "@main-ui/view-sandbox";

defineOptions({
  name: "GallerySandboxEditor",
});

defineProps<{
  context: EditorRenderContext;
}>();

/**
 * 初始沙盘文档：预置若干 shape 元素与连线，
 * 模拟复杂系统画廊展项（自由摆弄式画布）。
 */
const document = ref<SandboxDocument>({
  elements: [
    {
      id: "node-1",
      type: "shape",
      x: 80,
      y: 80,
      width: 140,
      height: 60,
      rotation: 0,
      shape: { kind: "rect", label: "Network Model", fill: "#e3f2fd" },
    },
    {
      id: "node-2",
      type: "shape",
      x: 320,
      y: 80,
      width: 140,
      height: 60,
      rotation: 0,
      shape: { kind: "rect", label: "Agent System", fill: "#fff3e0" },
    },
    {
      id: "node-3",
      type: "shape",
      x: 200,
      y: 240,
      width: 140,
      height: 60,
      rotation: 0,
      shape: { kind: "rect", label: "Emergence", fill: "#e8f5e9" },
    },
    {
      id: "node-4",
      type: "shape",
      x: 80,
      y: 400,
      width: 120,
      height: 50,
      rotation: 0,
      shape: { kind: "ellipse", label: "Input", fill: "#f3e5f5" },
    },
    {
      id: "node-5",
      type: "shape",
      x: 340,
      y: 400,
      width: 120,
      height: 50,
      rotation: 0,
      shape: { kind: "ellipse", label: "Output", fill: "#fce4ec" },
    },
    {
      id: "label-1",
      type: "shape",
      x: 160,
      y: 10,
      width: 220,
      height: 36,
      rotation: 0,
      shape: { kind: "text", label: "Complex System Exhibition Canvas" },
    },
  ],
  connections: [
    {
      id: "conn-1",
      source: { elementId: "node-1" },
      target: { elementId: "node-3" },
    },
    {
      id: "conn-2",
      source: { elementId: "node-2" },
      target: { elementId: "node-3" },
    },
    {
      id: "conn-3",
      source: { elementId: "node-4" },
      target: { elementId: "node-1" },
    },
    {
      id: "conn-4",
      source: { elementId: "node-3" },
      target: { elementId: "node-5" },
    },
  ],
});

function handleMove(intent: { elementId: string; x: number; y: number }): void {
  const el = document.value.elements.find((e) => e.id === intent.elementId);
  if (el) {
    el.x = intent.x;
    el.y = intent.y;
  }
}

function handleRemove(intent: { elementIds: string[] }): void {
  document.value = {
    ...document.value,
    elements: document.value.elements.filter((e) => !intent.elementIds.includes(e.id)),
    connections: document.value.connections.filter(
      (c) => !intent.elementIds.includes(c.source.elementId) && !intent.elementIds.includes(c.target.elementId),
    ),
  };
}
</script>

<template>
  <div class="gallery-sandbox-editor">
    <SandboxView
      :document="document"
      :editable="true"
      @element-move-intent="handleMove"
      @element-remove-intent="handleRemove"
    />
  </div>
</template>

<style scoped>
.gallery-sandbox-editor {
  width: 100%;
  height: 100%;
}
</style>
