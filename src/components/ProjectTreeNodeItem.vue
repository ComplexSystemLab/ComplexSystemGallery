<script setup lang="ts">
import { computed } from "vue";
import type { ProjectTreeNode } from "../types/projectTree";

defineOptions({
  name: "ProjectTreeNodeItem",
});

const props = withDefaults(
  defineProps<{
    node: ProjectTreeNode;
    depth?: number;
    selectedPath?: string | null;
    expandDepth?: number;
  }>(),
  {
    depth: 0,
    selectedPath: null,
    expandDepth: 1,
  },
);

const emit = defineEmits<{
  select: [projectPath: string];
  selectFolder: [folderPath: string];
}>();

function hasSelectedDescendant(node: ProjectTreeNode, selectedPath: string | null): boolean {
  if (!selectedPath) return false;
  if (node.type === "project") return node.path === selectedPath;
  return node.children.some((child) => hasSelectedDescendant(child, selectedPath));
}

const isFolderOpen = computed(() => {
  if (props.node.type === "project") return false;
  return props.depth < props.expandDepth || hasSelectedDescendant(props.node, props.selectedPath);
});

const isSelected = computed(() => props.node.type === "project" && props.node.path === props.selectedPath);
const isFolderSelected = computed(
  () => props.node.type === "folder" && props.node.path === props.selectedPath,
);
</script>

<template>
  <div
    v-if="node.type === 'project'"
    class="tree-entry tree-entry--project"
    :class="{ 'is-selected': isSelected }"
    :style="{ '--tree-depth': String(depth) }"
  >
    <button
      type="button"
      class="tree-button"
      :title="node.path"
      @click="emit('select', node.path)"
    >
      <span class="tree-glyph">▣</span>
      <span class="tree-text">{{ node.name }}</span>
    </button>
  </div>

  <details
    v-else
    class="tree-folder"
    :open="isFolderOpen"
  >
    <summary
      class="tree-entry tree-entry--folder"
      :class="{ 'is-selected': isFolderSelected }"
      :style="{ '--tree-depth': String(depth) }"
      :title="node.path"
      @click="emit('selectFolder', node.path)"
    >
      <span class="tree-glyph">▤</span>
      <span class="tree-text">{{ node.name }}</span>
      <span class="tree-meta">{{ node.children.length }}</span>
    </summary>

    <div class="tree-children">
      <ProjectTreeNodeItem
        v-for="child in node.children"
        :key="`${child.type}:${child.path}`"
        :node="child"
        :depth="depth + 1"
        :selected-path="selectedPath"
        :expand-depth="expandDepth"
        @select="emit('select', $event)"
        @select-folder="emit('selectFolder', $event)"
      />
    </div>
  </details>
</template>

<style scoped>
.tree-folder,
.tree-entry,
.tree-children {
  min-width: 0;
}

.tree-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding-left: calc(var(--tree-depth) * 14px);
  border-radius: 14px;
}

.tree-entry--folder {
  cursor: pointer;
  list-style: none;
  color: var(--main-ui-text-muted);
}

.tree-entry--folder:hover {
  background: rgba(12, 95, 159, 0.08);
  color: var(--main-ui-text);
}

.tree-entry--folder.is-selected {
  background: rgba(19, 33, 60, 0.08);
  box-shadow: inset 0 0 0 1px rgba(12, 95, 159, 0.16);
  color: var(--main-ui-accent-strong);
}

.tree-entry--folder::-webkit-details-marker {
  display: none;
}

.tree-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 34px;
  padding: 0 10px 0 0;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: inherit;
  text-align: left;
}

.tree-entry--project:hover .tree-button,
.tree-entry--project.is-selected .tree-button {
  background: rgba(19, 33, 60, 0.08);
}

.tree-entry--project.is-selected .tree-button {
  box-shadow: inset 0 0 0 1px rgba(12, 95, 159, 0.16);
  color: var(--main-ui-accent-strong);
}

.tree-glyph {
  display: inline-grid;
  place-items: center;
  width: 20px;
  flex-shrink: 0;
  color: var(--main-ui-accent);
}

.tree-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-meta {
  margin-left: auto;
  padding-right: 10px;
  font-size: 11px;
}

.tree-children {
  display: grid;
  gap: 2px;
}
</style>