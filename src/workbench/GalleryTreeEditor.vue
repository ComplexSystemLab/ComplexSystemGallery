<script setup lang="ts">
import { onMounted, ref, shallowRef } from "vue";
import type { EditorRenderContext } from "main-ui/core";
import { TreeView } from "@main-ui/view-tree";
import type { ViewTreeNode } from "@main-ui/view-tree";
import type { ProjectTree, ProjectTreeNode } from "../types/projectTree";
import { filterProjectTreeForGallery } from "../projects/projectRegistry";

defineOptions({
  name: "GalleryTreeEditor",
});

defineProps<{
  context: EditorRenderContext;
}>();

const rawTree = shallowRef<ProjectTree | null>(null);
const treeItems = ref<ViewTreeNode[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const selectedId = ref<string | null>(null);

let activeRequest: AbortController | null = null;

/**
 * 把 ProjectTreeNode[] 转换为 ViewTreeNode[] 格式。
 */
function convertToViewTreeNodes(nodes: ProjectTreeNode[]): ViewTreeNode[] {
  return nodes.map((node) => {
    if (node.type === "folder") {
      return {
        id: node.path,
        label: node.name,
        icon: "▤",
        children: convertToViewTreeNodes(node.children),
      };
    }
    return {
      id: node.path,
      label: node.name,
      icon: "▣",
    };
  });
}

async function loadTree(): Promise<void> {
  activeRequest?.abort();
  const controller = new AbortController();
  activeRequest = controller;
  error.value = null;
  loading.value = true;

  try {
    const response = await fetch("/projects-tree.json", {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`加载项目树失败: ${response.status}`);
    }
    const payload = (await response.json()) as ProjectTree;
    if (controller.signal.aborted) return;
    rawTree.value = payload;
    const filtered = filterProjectTreeForGallery(payload, { showUnregistered: true });
    treeItems.value = convertToViewTreeNodes(filtered.children);
  } catch (cause) {
    if (controller.signal.aborted) return;
    treeItems.value = [];
    error.value = cause instanceof Error ? cause.message : String(cause);
  } finally {
    if (activeRequest === controller) {
      loading.value = false;
    }
  }
}

function handleSelect(nodeId: string): void {
  selectedId.value = nodeId;
  // 通知 GalleryWorkbenchEditor 导航到该项目
  window.dispatchEvent(new CustomEvent("gallery:navigate", { detail: { path: nodeId } }));
}

onMounted(() => {
  void loadTree();
});
</script>

<template>
  <div class="gallery-tree-editor">
    <TreeView
      :items="treeItems"
      :loading="loading"
      :error="error"
      :selected-id="selectedId"
      :filterable="true"
      :item-height="28"
      @select="handleSelect"
    />
  </div>
</template>

<style scoped>
.gallery-tree-editor {
  width: 100%;
  height: 100%;
}
</style>
