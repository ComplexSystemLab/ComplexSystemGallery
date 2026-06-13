<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import type { EditorRenderContext, JsonObject } from "main-ui/core";
import { ViewportBusinessCanvasShell } from "viewport-2d-kit/vue";
import ProjectTreeNodeItem from "../components/ProjectTreeNodeItem.vue";
import {
  filterProjectTreeForGallery,
  getGalleryProjectEntry,
  getProjectDisplayTitle,
  listGalleryProjectEntries,
} from "../projects/projectRegistry";
import type { ProjectTree, ProjectTreeNode } from "../types/projectTree";

defineOptions({
  name: "GalleryWorkbenchEditor",
});

type GalleryRoute = {
  projectPath: string | null;
};

const REGISTERED_ENTRIES = listGalleryProjectEntries();
const REGISTERED_PROJECT_COUNT = REGISTERED_ENTRIES.length;
const READY_DEMO_COUNT = REGISTERED_ENTRIES.filter((entry) => Boolean(entry.demoUrl)).length;
const DEFAULT_SOURCE = "../ComplexSystemLab/ComplexSystemLab/Projects";

const props = defineProps<{
  context: EditorRenderContext;
}>();

const tree = shallowRef<ProjectTree | null>(null);
const error = ref<string | null>(null);
const isLoading = ref(false);
const selectedProjectPath = ref<string | null>(parseRoute(window.location).projectPath);

let activeRequest: AbortController | null = null;

function parseRoute(location: Location): GalleryRoute {
  if (location.pathname === "/project") {
    const params = new URLSearchParams(location.search);
    const projectPath = params.get("path")?.trim();
    if (projectPath) return { projectPath };
  }
  return { projectPath: null };
}

function countProjects(nodes: ProjectTreeNode[]): number {
  return nodes.reduce((total, node) => {
    if (node.type === "project") return total + 1;
    return total + countProjects(node.children);
  }, 0);
}

function countFolders(nodes: ProjectTreeNode[]): number {
  return nodes.reduce((total, node) => {
    if (node.type === "project") return total;
    return total + 1 + countFolders(node.children);
  }, 0);
}

function findNodeByPath(nodes: ProjectTreeNode[], targetPath: string): ProjectTreeNode | null {
  for (const node of nodes) {
    if (node.path === targetPath) return node;
    if (node.type === "folder") {
      const nested = findNodeByPath(node.children, targetPath);
      if (nested) return nested;
    }
  }

  return null;
}

function formatTimestamp(rawValue: string | undefined): string {
  if (!rawValue) return "等待生成";

  const timestamp = new Date(rawValue);
  if (Number.isNaN(timestamp.getTime())) return rawValue;

  return timestamp.toLocaleString("zh-CN", {
    hour12: false,
  });
}

function navigateTo(projectPath: string | null): void {
  const url = projectPath ? `/project?path=${encodeURIComponent(projectPath)}` : "/";
  window.history.pushState({}, "", url);
  selectedProjectPath.value = projectPath;
}

async function loadTree(): Promise<void> {
  activeRequest?.abort();
  const controller = new AbortController();
  activeRequest = controller;
  error.value = null;
  isLoading.value = true;

  try {
    const response = await fetch("/projects-tree.json", {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`加载 projects-tree.json 失败: ${response.status}`);
    }

    const payload = (await response.json()) as ProjectTree;
    if (controller.signal.aborted) return;
    tree.value = filterProjectTreeForGallery(payload);
  } catch (cause) {
    if (controller.signal.aborted) return;
    tree.value = null;
    error.value = cause instanceof Error ? cause.message : String(cause);
  } finally {
    if (activeRequest === controller) {
      isLoading.value = false;
    }
  }
}

function handlePopstate(): void {
  selectedProjectPath.value = parseRoute(window.location).projectPath;
}

const selectedEntry = computed(() =>
  selectedProjectPath.value ? getGalleryProjectEntry(selectedProjectPath.value) : null,
);
const selectedNode = computed<ProjectTreeNode | null>(() => {
  if (!tree.value || !selectedProjectPath.value) return null;
  return findNodeByPath(tree.value.children, selectedProjectPath.value);
});
const selectedAutoDemoUrl = computed(() => {
  if (selectedNode.value?.type !== "project") return null;
  return selectedNode.value.autoDemoUrl ?? null;
});
const selectedDemoUrl = computed(() => selectedEntry.value?.demoUrl ?? selectedAutoDemoUrl.value);
const isFolderSelection = computed(() => selectedNode.value?.type === "folder");
const selectedFolderChildren = computed(() => {
  if (selectedNode.value?.type !== "folder") return [];

  return selectedNode.value.children.map((child) => ({
    path: child.path,
    type: child.type,
    title: getProjectDisplayTitle(child.path),
  }));
});
const selectedProjectFiles = computed(() => {
  if (selectedNode.value?.type !== "project") return [];
  return selectedNode.value.projectFiles ?? [];
});
const selectedProjectFileLinks = computed(() => {
  const node = selectedNode.value;
  if (node?.type !== "project") return [];

  return selectedProjectFiles.value.map((fileName) => ({
    fileName,
    href: `/projects-src/${node.path}/${fileName}`,
  }));
});

const selectedTitle = computed(() =>
  selectedProjectPath.value ? getProjectDisplayTitle(selectedProjectPath.value) : "选择一个项目",
);

const routeHref = computed(() =>
  selectedProjectPath.value
    ? `/project?path=${encodeURIComponent(selectedProjectPath.value)}`
    : "/",
);

const visibleProjectCount = computed(() => (tree.value ? countProjects(tree.value.children) : 0));
const folderCount = computed(() => (tree.value ? countFolders(tree.value.children) : 0));
const treeSourceLabel = computed(() => tree.value?.source ?? DEFAULT_SOURCE);
const generatedAtLabel = computed(() => formatTimestamp(tree.value?.generatedAt));
const selectedPathSegments = computed(() =>
  selectedProjectPath.value?.split("/").filter(Boolean) ?? [],
);
const selectedBadges = computed(() => selectedEntry.value?.badges ?? ["project.txt leaf", "待接入"]);
const selectedDescription = computed(() => {
  if (!selectedProjectPath.value) {
    return "从左侧目录树选择一个项目后，中间视口会切换到项目概览，右侧会显示 live demo 或接入状态。";
  }

  if (selectedNode.value?.type === "folder") {
    return `该目录包含 ${selectedNode.value.children.length} 个子节点。可继续点击子项目，或在右侧使用“快速打开子项”直接跳转。`;
  }

  if (selectedDemoUrl.value) {
    return (
      selectedEntry.value?.description ??
      "已自动发现该项目的 HTML 入口，当前使用 Projects 静态资源直连预览。若需更完整说明，可在注册表补充 description、category 与 badges。"
    );
  }

  return (
    selectedEntry.value?.description ??
    "该目录已被扫描为叶子项目，但当前还没有在 Gallery 注册 demoUrl 或定制说明。"
  );
});
const selectedBadgesResolved = computed(() => {
  if (selectedNode.value?.type === "folder") {
    return ["folder", `${selectedNode.value.children.length} children`, "tree navigation"];
  }
  if (!selectedEntry.value && selectedDemoUrl.value) {
    return ["auto-demo", selectedNode.value?.type === "project" ? selectedNode.value.detectedBy ?? "detected" : "detected", "html"];
  }
  return selectedBadges.value;
});
const selectedPayload = computed(() => JSON.stringify(props.context.editor.payload as JsonObject, null, 2));

onMounted(() => {
  void loadTree();
  window.addEventListener("popstate", handlePopstate);
});

onBeforeUnmount(() => {
  activeRequest?.abort();
  window.removeEventListener("popstate", handlePopstate);
});
</script>

<template>
  <div class="gallery-editor">
    <ViewportBusinessCanvasShell
      :left-panel-width="320"
      :right-panel-width="360"
      :toolbar-height="48"
    >
      <template #left>
        <section class="panel panel--tree">
          <div class="panel-header">
            <div>
              <div class="panel-eyebrow">
                Project Tree
              </div>
              <h2>ComplexSystemGallery</h2>
            </div>
            <button
              type="button"
              class="panel-button"
              :disabled="isLoading"
              @click="loadTree"
            >
              {{ isLoading ? "刷新中" : "刷新" }}
            </button>
          </div>

          <p class="panel-copy">
            当前站点已迁移到 Vue3，并通过 main-ui 作为工作台壳，使用 viewport-2d-kit 承载项目概览视口。
          </p>

          <div class="stat-grid">
            <article class="stat-card">
              <span>Visible projects</span>
              <strong>{{ visibleProjectCount }}</strong>
            </article>
            <article class="stat-card">
              <span>Registered demos</span>
              <strong>{{ READY_DEMO_COUNT }}</strong>
            </article>
            <article class="stat-card">
              <span>Registered projects</span>
              <strong>{{ REGISTERED_PROJECT_COUNT }}</strong>
            </article>
            <article class="stat-card">
              <span>Folders</span>
              <strong>{{ folderCount }}</strong>
            </article>
            <article class="stat-card">
              <span>Workspace</span>
              <strong>{{ context.workspaceId }}</strong>
            </article>
          </div>

          <div class="meta-card">
            <div><strong>Source</strong> {{ treeSourceLabel }}</div>
            <div><strong>Generated</strong> {{ generatedAtLabel }}</div>
          </div>

          <div
            v-if="error"
            class="feedback feedback--error"
          >
            {{ error }}
          </div>
          <div
            v-else-if="isLoading && !tree"
            class="feedback"
          >
            正在加载项目树…
          </div>

          <div
            v-if="tree"
            class="tree-scroll"
          >
            <ProjectTreeNodeItem
              v-for="node in tree.children"
              :key="`${node.type}:${node.path}`"
              :node="node"
              :selected-path="selectedProjectPath"
              @select="navigateTo($event)"
              @select-folder="navigateTo($event)"
            />
          </div>
        </section>
      </template>

      <template #toolbarLeading>
        <span class="toolbar-pill">{{ context.tab?.title ?? "Project Browser" }}</span>
      </template>

      <template #toolbarCenter>
        <div class="toolbar-title">
          <strong>{{ selectedProjectPath ? selectedTitle : "Project Overview" }}</strong>
          <span>
            {{
              selectedProjectPath
                ? selectedDescription
                : "选择项目后，这里会同步显示项目说明、固定链接和 demo 接入状态。"
            }}
          </span>
        </div>
      </template>

      <template #toolbarTrailing>
        <button
          type="button"
          class="panel-button panel-button--ghost"
          :disabled="!selectedProjectPath"
          @click="navigateTo(null)"
        >
          回到总览
        </button>
        <a
          v-if="selectedDemoUrl"
          class="panel-link"
          :href="selectedDemoUrl"
          target="_blank"
          rel="noreferrer"
        >
          新标签打开 Demo
        </a>
      </template>

      <section class="main-stage">
        <div class="main-stage__header">
          <div>
            <div class="panel-eyebrow">
              {{ selectedDemoUrl ? "Live Demo" : selectedProjectPath ? "Project Detail" : "Welcome" }}
            </div>
            <h2>{{ selectedProjectPath ? selectedTitle : "选择一个项目开始浏览" }}</h2>
            <p class="main-stage__copy">
              {{
                selectedProjectPath
                  ? selectedDemoUrl
                    ? "主舞台已切换到当前项目的演示界面。右侧只保留路径、标签和辅助信息。"
                    : "当前项目没有可直接预览的 Demo，主舞台会优先展示项目文件入口。"
                  : "从左侧选择一个项目后，主舞台会直接展示演示界面。"
              }}
            </p>
          </div>

          <div class="main-stage__actions">
            <a
              v-if="selectedDemoUrl"
              class="panel-link"
              :href="selectedDemoUrl"
              target="_blank"
              rel="noreferrer"
            >
              独立打开 Demo
            </a>
            <a
              class="panel-link panel-link--ghost"
              :href="routeHref"
            >
              固定链接
            </a>
          </div>
        </div>

        <div
          v-if="selectedDemoUrl"
          class="main-stage__surface main-stage__surface--demo"
        >
          <iframe
            class="main-stage__iframe"
            :title="selectedTitle"
            :src="selectedDemoUrl"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
        </div>

        <div
          v-else-if="selectedProjectFileLinks.length"
          class="main-stage__surface main-stage__surface--files"
        >
          <div class="folder-shell__header">
            <span>项目文件入口</span>
            <span>{{ selectedProjectFileLinks.length }} files</span>
          </div>
          <div class="folder-shell__list">
            <a
              v-for="file in selectedProjectFileLinks"
              :key="file.href"
              class="folder-item folder-item--link"
              :href="file.href"
              target="_blank"
              rel="noreferrer"
            >
              <span>文件</span>
              <strong>{{ file.fileName }}</strong>
            </a>
          </div>
        </div>

        <div
          v-else
          class="main-stage__surface main-stage__surface--empty"
        >
          <strong>{{ selectedProjectPath ? "暂无演示内容" : "等待选择项目" }}</strong>
          <span>
            {{
              selectedProjectPath
                ? "当前项目没有可直接预览的 HTML 入口。你可以在右侧查看路径与标签，或回到左侧选择别的项目。"
                : "中间区域会优先承载 Demo，本页不再把主要内容压缩到角落。"
            }}
          </span>
        </div>
      </section>

      <template #right>
        <section class="panel panel--detail">
          <div class="panel-header panel-header--stack">
            <div>
              <div class="panel-eyebrow">
                Selection
              </div>
              <h2>{{ selectedProjectPath ? selectedTitle : "暂无选择" }}</h2>
            </div>
            <a
              class="panel-link"
              :href="routeHref"
            >固定链接</a>
          </div>

          <p class="panel-copy">
            {{ selectedDescription }}
          </p>

          <div
            v-if="selectedPathSegments.length"
            class="meta-card"
          >
            <strong>Path</strong>
            <div class="segment-list">
              <span
                v-for="segment in selectedPathSegments"
                :key="segment"
                class="segment-chip"
              >{{ segment }}</span>
            </div>
          </div>

          <div class="meta-card meta-card--badges">
            <strong>Badges</strong>
            <div class="segment-list">
              <span
                v-for="badge in selectedBadgesResolved"
                :key="badge"
                class="segment-chip segment-chip--muted"
              >{{ badge }}</span>
            </div>
          </div>

          <div class="meta-card">
            <strong>Editor payload</strong>
            <pre>{{ selectedPayload }}</pre>
          </div>

          <div
            v-if="isFolderSelection"
            class="folder-shell"
          >
            <div class="folder-shell__header">
              <span>快速打开子项</span>
              <span>{{ selectedFolderChildren.length }} items</span>
            </div>
            <div class="folder-shell__list">
              <button
                v-for="child in selectedFolderChildren"
                :key="child.path"
                type="button"
                class="folder-item"
                @click="navigateTo(child.path)"
              >
                <span>{{ child.type === "folder" ? "目录" : "项目" }}</span>
                <strong>{{ child.title }}</strong>
              </button>
            </div>
          </div>

          <div
            v-else
            class="empty-state"
          >
            <strong>{{ selectedProjectPath ? "未接入 Demo" : "等待选择项目" }}</strong>
            <span>
              {{
                selectedProjectPath
                  ? "当前项目已经被树扫描发现，但尚未找到可直接预览的 HTML 入口，也没有注册 demoUrl。"
                  : "选择左侧任意叶子项目后，这里会显示对应的 live preview 或接入状态。"
              }}
            </span>
          </div>
        </section>
      </template>
    </ViewportBusinessCanvasShell>
  </div>
</template>

<style scoped>
.gallery-editor {
  width: 100%;
  height: 100%;
}

.panel {
  display: grid;
  gap: 16px;
  align-content: start;
  height: 100%;
}

.panel--tree,
.panel--detail {
  padding-bottom: 10px;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-header--stack {
  align-items: center;
}

.panel-eyebrow,
.scene-card__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--main-ui-accent);
}

.panel h2,
.scene-card h3 {
  margin: 0;
}

.panel-copy,
.scene-card p,
.empty-state span,
.toolbar-title span,
.meta-card,
.meta-card pre {
  color: var(--main-ui-text-muted);
  line-height: 1.6;
}

.panel-copy,
.scene-card p,
.meta-card pre,
.empty-state span {
  margin: 0;
}

.panel-button,
.panel-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(12, 95, 159, 0.16);
  background: rgba(12, 95, 159, 0.08);
  color: var(--main-ui-accent-strong);
  font-size: 12px;
  font-weight: 600;
}

.panel-button:hover,
.panel-link:hover {
  background: rgba(12, 95, 159, 0.14);
}

.panel-button:disabled {
  cursor: default;
  opacity: 0.5;
}

.panel-button--ghost {
  background: rgba(255, 255, 255, 0.7);
}

.panel-link--ghost {
  background: rgba(255, 255, 255, 0.65);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.stat-card,
.meta-card,
.empty-state {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: inset 0 0 0 1px rgba(17, 24, 39, 0.06);
}

.stat-card strong {
  font-size: 24px;
  color: var(--main-ui-text);
}

.tree-scroll {
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
}

.feedback {
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(19, 33, 60, 0.06);
  color: var(--main-ui-text-muted);
}

.feedback--error {
  background: rgba(187, 54, 70, 0.1);
  color: #8e2432;
}

.toolbar-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(19, 33, 60, 0.08);
  color: var(--main-ui-accent-strong);
  font-size: 12px;
  font-weight: 600;
}

.toolbar-title {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.toolbar-title strong,
.toolbar-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scene-root {
  position: absolute;
  overflow: visible;
}

.scene-glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(10px);
  opacity: 0.45;
}

.scene-glow--one {
  left: 48px;
  top: 46px;
  width: 250px;
  height: 250px;
  background: rgba(250, 196, 120, 0.38);
}

.scene-glow--two {
  right: 64px;
  bottom: 70px;
  width: 280px;
  height: 280px;
  background: rgba(108, 154, 215, 0.28);
}

.scene-links {
  position: absolute;
  inset: 0;
  overflow: visible;
}

.scene-link {
  fill: none;
  stroke-width: 6;
  stroke-linecap: round;
  opacity: 0.52;
}

.scene-link.is-accent {
  stroke: rgba(24, 94, 161, 0.5);
}

.scene-link.is-muted {
  stroke: rgba(56, 73, 97, 0.26);
}

.scene-link.is-warm {
  stroke: rgba(228, 150, 76, 0.46);
}

.scene-card {
  position: absolute;
  display: grid;
  gap: 10px;
  padding: 22px 22px 20px;
  border-radius: 28px;
  box-shadow:
    0 24px 60px rgba(19, 33, 60, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.26);
}

.scene-card h3 {
  font-size: 28px;
  line-height: 1.15;
}

.scene-card p {
  white-space: pre-line;
}

.scene-card__chip {
  display: inline-flex;
  width: fit-content;
  min-height: 30px;
  align-items: center;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 12px;
  font-weight: 600;
}

.tone-hero {
  background: linear-gradient(140deg, #12203d 0%, #1b3f70 100%);
  color: #f7fbff;
}

.tone-hero .scene-card__eyebrow,
.tone-hero p {
  color: rgba(235, 243, 255, 0.84);
}

.tone-accent {
  background: linear-gradient(155deg, #e7f2ff 0%, #cde0ff 100%);
  color: #123965;
}

.tone-muted {
  background: rgba(255, 255, 255, 0.8);
  color: var(--main-ui-text);
}

.tone-warm {
  background: linear-gradient(155deg, #fff1dc 0%, #ffd9a8 100%);
  color: #6b4308;
}

.segment-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.segment-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(19, 33, 60, 0.08);
  color: var(--main-ui-text);
  font-size: 12px;
}

.segment-chip--muted {
  background: rgba(12, 95, 159, 0.08);
  color: var(--main-ui-accent-strong);
}

.meta-card--badges {
  gap: 10px;
}

.meta-card pre {
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.main-stage {
  display: grid;
  gap: 16px;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 18px;
}

.main-stage__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.main-stage__header h2 {
  margin: 2px 0 0;
  font-size: clamp(22px, 2.1vw, 32px);
  line-height: 1.12;
}

.main-stage__copy {
  margin: 6px 0 0;
  max-width: 64ch;
  color: var(--main-ui-text-muted);
  line-height: 1.6;
}

.main-stage__actions {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.main-stage__surface {
  min-height: 0;
  flex: 1;
  padding: 16px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow:
    inset 0 0 0 1px rgba(17, 24, 39, 0.08),
    0 18px 50px rgba(19, 33, 60, 0.08);
}

.main-stage__surface--demo {
  display: grid;
}

.main-stage__iframe {
  width: 100%;
  height: 100%;
  min-height: 0;
  border: 0;
  border-radius: 22px;
  background: #ffffff;
}

.main-stage__surface--files,
.main-stage__surface--empty {
  display: grid;
  gap: 12px;
  align-content: start;
}

.main-stage__surface--empty strong {
  color: var(--main-ui-text);
}

.folder-shell {
  display: grid;
  gap: 10px;
  min-height: 240px;
  padding: 14px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: inset 0 0 0 1px rgba(17, 24, 39, 0.08);
}

.folder-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--main-ui-text-muted);
}

.folder-shell__list {
  display: grid;
  gap: 8px;
}

.folder-item {
  display: grid;
  gap: 2px;
  text-align: left;
  padding: 12px 14px;
  border: 1px solid rgba(12, 95, 159, 0.14);
  border-radius: 14px;
  background: rgba(12, 95, 159, 0.06);
  color: var(--main-ui-text);
}

.folder-item span {
  font-size: 12px;
  color: var(--main-ui-text-muted);
}

.folder-item:hover {
  background: rgba(12, 95, 159, 0.12);
}

.folder-item--link {
  text-decoration: none;
}

.preview-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.preview-frame {
  width: 100%;
  min-height: 0;
  height: 100%;
  border: 0;
  border-radius: 18px;
  background: #ffffff;
}

.empty-state strong {
  color: var(--main-ui-text);
}

@media (max-width: 1080px) {
  .stat-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>