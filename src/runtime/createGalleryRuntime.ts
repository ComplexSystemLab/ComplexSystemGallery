import {
  createLocalStoragePersistenceAdapter,
  createSingleGroupLayout,
  defaultEditorCapability,
  defaultModalPresentation,
  defaultTabPresentation,
  type EditorDescriptor,
  type SettingsPersistenceAdapter,
  type SettingsSnapshot,
  type WorkspaceDescriptor,
} from "main-ui/core";
import { createMainUiRuntime } from "main-ui/vue";
import GallerySettingsEditor from "../workbench/GallerySettingsEditor.vue";
import GalleryWorkbenchEditor from "../workbench/GalleryWorkbenchEditor.vue";

/**
 * 基于 localStorage 的设置持久化适配器。
 *
 * main-ui 0.1.0 仅内置了 memory 版本；Gallery 需要设置跨会话保留，
 * 因此在此提供一个轻量的 localStorage 实现。
 *
 * @param storageKey localStorage 键名。
 * @returns 设置持久化适配器。
 */
const createLocalStorageSettingsPersistenceAdapter = (
  storageKey: string,
): SettingsPersistenceAdapter => ({
  async load() {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SettingsSnapshot;
    } catch {
      return null;
    }
  },
  async save(snapshot) {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(storageKey, JSON.stringify(snapshot));
  },
  async clear() {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(storageKey);
  },
});

const GALLERY_EDITOR: EditorDescriptor = {
  kind: "gallery-browser",
  title: "Project Browser",
  description: "Vue3 gallery surface backed by main-ui and viewport-2d-kit.",
  icon: "CG",
  rendererKey: "gallery-browser-editor",
  capability: {
    ...defaultEditorCapability,
    allowMultipleInstances: false,
    allowDuplicate: false,
  },
  presentation: defaultTabPresentation,
  availability: {
    allowedWorkspaceIds: ["gallery"],
  },
  createDefaultPayload: () => ({
    mode: "gallery-browser",
  }),
};

const GALLERY_SETTINGS_EDITOR: EditorDescriptor = {
  kind: "gallery-settings",
  title: "Gallery Settings",
  description: "Gallery 外观与项目树浏览行为设置。",
  icon: "settings",
  rendererKey: "gallery-settings-editor",
  capability: {
    ...defaultEditorCapability,
    allowMultipleInstances: false,
    allowDuplicate: false,
    launcherVisibility: "visible",
  },
  presentation: defaultModalPresentation,
  availability: {
    allowedWorkspaceIds: ["gallery"],
  },
  createDefaultPayload: () => ({
    mode: "gallery-settings",
  }),
};

const GALLERY_WORKSPACE: WorkspaceDescriptor = {
  id: "gallery",
  title: "Gallery",
  description: "ComplexSystemLab project browser.",
  icon: "CG",
  allowedEditorKinds: [GALLERY_EDITOR.kind, GALLERY_SETTINGS_EDITOR.kind],
  recommendedEditorKinds: [GALLERY_EDITOR.kind],
  defaultOpenRequests: [
    {
      editorKind: GALLERY_EDITOR.kind,
      title: GALLERY_EDITOR.title,
    },
  ],
  createDefaultLayout: () =>
    createSingleGroupLayout({
      groupId: "gallery-group",
      leafNodeId: "gallery-leaf",
    }),
  allowUserReset: true,
};

export function createGalleryRuntime() {
  const runtime = createMainUiRuntime({
    persistence: createLocalStoragePersistenceAdapter("complex-system-gallery:workbench:v3"),
    settingsPersistence: createLocalStorageSettingsPersistenceAdapter(
      "complex-system-gallery:settings:v1",
    ),
    activeWorkspaceId: GALLERY_WORKSPACE.id,
  });

  runtime.core.registerEditor(GALLERY_EDITOR);
  runtime.core.registerEditor(GALLERY_SETTINGS_EDITOR);
  runtime.core.registerWorkspace(GALLERY_WORKSPACE);
  runtime.vue.registerEditorRenderer(GALLERY_EDITOR.rendererKey, GalleryWorkbenchEditor);
  runtime.vue.registerEditorRenderer(GALLERY_SETTINGS_EDITOR.rendererKey, GallerySettingsEditor);

  // 命令：通过 window 自定义事件与编辑器解耦，或直接 dispatch 布局动作。
  runtime.core.registerCommand({
    id: "gallery.refreshTree",
    title: "刷新项目树",
    category: "Gallery",
    run: () => {
      window.dispatchEvent(new CustomEvent("gallery:refresh-tree"));
    },
  });
  runtime.core.registerCommand({
    id: "gallery.goHome",
    title: "回到总览",
    category: "Gallery",
    run: () => {
      window.dispatchEvent(new CustomEvent("gallery:go-home"));
    },
  });
  runtime.core.registerCommand({
    id: "gallery.resetLayout",
    title: "重置工作台布局",
    category: "Gallery",
    run: () => {
      void runtime.core.dispatch({
        type: "layout/resetWorkspace",
        workspaceId: GALLERY_WORKSPACE.id,
      });
    },
  });

  // 快捷键：Cmd/Ctrl+R 刷新项目树（不拦截输入框内按键）。
  runtime.core.registerKeybinding({
    commandId: "gallery.refreshTree",
    keybinding: "Cmd+R",
    allowInInput: false,
  });

  // 菜单栏入口（menubar 扁平项，点击即执行对应命令）。
  runtime.core.registerMenu({
    id: "gallery.menu.refresh",
    location: "menubar",
    label: "刷新项目树",
    commandId: "gallery.refreshTree",
    order: 10,
  });
  runtime.core.registerMenu({
    id: "gallery.menu.goHome",
    location: "menubar",
    label: "回到总览",
    commandId: "gallery.goHome",
    order: 20,
  });
  runtime.core.registerMenu({
    id: "gallery.menu.reset",
    location: "menubar",
    label: "重置布局",
    commandId: "gallery.resetLayout",
    order: 30,
  });

  // 设置项：由 SettingsEditor（modal overlay）可视化编辑。
  runtime.core.registerSettingSchema({
    id: "gallery.showUnregisteredProjects",
    title: "显示未注册项目",
    description: "在项目树中显示尚未在 Gallery 注册 demoUrl 的叶子项目。",
    category: "Gallery",
    type: "boolean",
    defaultValue: true,
  });
  runtime.core.registerSettingSchema({
    id: "gallery.treeExpandDepth",
    title: "树默认展开层级",
    description: "项目树默认展开的文件夹层级深度。",
    category: "Gallery",
    type: "number",
    defaultValue: 1,
    min: 0,
    max: 5,
  });

  return runtime;
}