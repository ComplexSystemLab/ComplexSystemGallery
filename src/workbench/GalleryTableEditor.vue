<script setup lang="ts">
import { ref } from "vue";
import type { EditorRenderContext } from "main-ui/core";
import { TableView } from "@main-ui/view-table";
import type { TableColumn, TableRow } from "@main-ui/view-table";
import { listGalleryProjectEntries } from "../projects/projectRegistry";

defineOptions({
  name: "GalleryTableEditor",
});

defineProps<{
  context: EditorRenderContext;
}>();

const COLUMNS: TableColumn[] = [
  { key: "title", title: "项目名称", sortable: true },
  { key: "category", title: "类别", width: 140, sortable: true },
  { key: "demoUrl", title: "Demo URL", width: 200 },
  { key: "badges", title: "标签", width: 220 },
];

const entries = listGalleryProjectEntries();

const ROWS: TableRow[] = entries.map((entry) => ({
  id: entry.projectPath,
  title: entry.title,
  category: entry.category,
  demoUrl: entry.demoUrl ?? "—",
  badges: entry.badges.join(", "),
}));

const selectedRowId = ref<string | null>(null);

function handleRowSelect(rowId: string): void {
  selectedRowId.value = rowId;
  window.dispatchEvent(new CustomEvent("gallery:navigate", { detail: { path: rowId } }));
}
</script>

<template>
  <div class="gallery-table-editor">
    <TableView
      :columns="COLUMNS"
      :rows="ROWS"
      :selected-row-id="selectedRowId"
      :editable="false"
      row-key="id"
      @row-select="handleRowSelect"
    />
  </div>
</template>

<style scoped>
.gallery-table-editor {
  width: 100%;
  height: 100%;
}
</style>
