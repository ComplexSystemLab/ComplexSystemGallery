import {
  createLocalStoragePersistenceAdapter,
  createSingleGroupLayout,
  defaultEditorCapability,
  defaultTabPresentation,
  type EditorDescriptor,
  type WorkspaceDescriptor,
} from "main-ui/core";
import { createMainUiRuntime } from "main-ui/vue";
import GalleryWorkbenchEditor from "../workbench/GalleryWorkbenchEditor.vue";

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

const GALLERY_WORKSPACE: WorkspaceDescriptor = {
  id: "gallery",
  title: "Gallery",
  description: "ComplexSystemLab project browser.",
  icon: "CG",
  allowedEditorKinds: [GALLERY_EDITOR.kind],
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
    persistence: createLocalStoragePersistenceAdapter("complex-system-gallery:workbench:v2"),
    activeWorkspaceId: GALLERY_WORKSPACE.id,
  });

  runtime.core.registerEditor(GALLERY_EDITOR);
  runtime.core.registerWorkspace(GALLERY_WORKSPACE);
  runtime.vue.registerEditorRenderer(GALLERY_EDITOR.rendererKey, GalleryWorkbenchEditor);

  return runtime;
}