import type { ProjectTree, ProjectTreeNode } from "../types/projectTree";

/**
 * Gallery 内部注册的“可展示项目”。
 */
export type GalleryProjectEntry = {
  /** 项目路径（用于与 `projects-tree.json` 的叶子节点匹配）。 */
  projectPath: string;
  /** 项目标题（用于项目页顶部显示）。 */
  title: string;
  /** 是否在项目树中展示该项目。 */
  visibleInTree: boolean;
  /** 预览 demo URL。 */
  demoUrl?: string;
  /** 项目简介。 */
  description: string;
  /** 项目类别。 */
  category: string;
  /** 辅助标签。 */
  badges: string[];
};

const GALLERY_PROJECT_ENTRIES: readonly GalleryProjectEntry[] = [
  {
    projectPath: "graph_algorithms-js/projects/block_connectivity",
    title: "block_connectivity（方块连通性）",
    visibleInTree: true,
    demoUrl: "/demos/graph_algorithms_js/block_connectivity/index.html",
    description: "通过离散方块场景展示连通分量识别，适合作为图算法与网格判连的基础演示。",
    category: "Graph Algorithms",
    badges: ["demo", "connected-components", "grid"],
  },
  {
    projectPath: "graph_algorithms-js/projects/graph_connectivity",
    title: "graph_connectivity（图连通性）",
    visibleInTree: true,
    demoUrl: "/demos/graph_algorithms_js/graph_connectivity/index.html",
    description: "以节点和边的形式展示图连通性分析，可用于快速验证图遍历与分量划分逻辑。",
    category: "Graph Algorithms",
    badges: ["demo", "graph", "connectivity"],
  },
  {
    projectPath: "graph_algorithms-js/projects/poisson_disk",
    title: "poisson_disk（泊松圆盘采样）",
    visibleInTree: true,
    demoUrl: "/demos/graph_algorithms_js/poisson_disk/index.html",
    description: "展示 Poisson disk 采样的生成过程，适合作为空间采样、布局与可视化算法的演示底板。",
    category: "Sampling",
    badges: ["demo", "sampling", "visualization"],
  },
];

const GALLERY_PROJECT_ENTRY_MAP: Readonly<Record<string, GalleryProjectEntry>> = Object.fromEntries(
  GALLERY_PROJECT_ENTRIES.map((entry) => [entry.projectPath, entry]),
);

/**
 * 是否在树中展示“未注册项目”。
 *
 * - `false`：只展示已注册项目（默认）
 * - `true`：展示所有项目（未注册项目点击后会显示“未实现/未展示”提示）
 */
export const SHOW_UNREGISTERED_PROJECTS_IN_TREE = true;

/**
 * 获取所有注册项目。
 */
export function listGalleryProjectEntries(): GalleryProjectEntry[] {
  return [...GALLERY_PROJECT_ENTRIES];
}

/**
 * 读取某个项目的注册信息。
 *
 * @param projectPath 项目路径（相对 `Projects` 根目录）。
 * @returns 注册信息；如果未注册则返回 `null`。
 */
export function getGalleryProjectEntry(projectPath: string): GalleryProjectEntry | null {
  return GALLERY_PROJECT_ENTRY_MAP[projectPath] ?? null;
}

/**
 * 获取项目显示标题；未注册时对路径名做可读化处理。
 */
export function getProjectDisplayTitle(projectPath: string): string {
  const entry = getGalleryProjectEntry(projectPath);
  if (entry) return entry.title;

  const segment = projectPath.split("/").filter(Boolean).at(-1) ?? projectPath;
  return segment
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * 判断某个项目是否应该出现在项目树中。
 *
 * @param projectPath 项目路径。
 * @returns 是否在树中可见。
 */
export function isProjectVisibleInTree(projectPath: string): boolean {
  if (SHOW_UNREGISTERED_PROJECTS_IN_TREE) return true;
  const entry = getGalleryProjectEntry(projectPath);
  return Boolean(entry?.visibleInTree);
}

/**
 * 过滤项目树：移除不展示的项目，同时剪枝空文件夹。
 *
 * @param root 原始项目树。
 * @returns 过滤后的项目树。
 */
export function filterProjectTreeForGallery(root: ProjectTree): ProjectTree {
  /**
   * 递归过滤节点。
   *
   * @param node 节点。
   * @returns 过滤后的节点；若应被移除则返回 `null`。
   */
  function filterNode(node: ProjectTreeNode): ProjectTreeNode | null {
    if (node.type === "project") {
      return isProjectVisibleInTree(node.path) ? node : null;
    }

    const children = node.children.map(filterNode).filter(Boolean) as ProjectTreeNode[];
    if (children.length === 0) return null;
    return { ...node, children };
  }

  return {
    ...root,
    children: root.children.map(filterNode).filter(Boolean) as ProjectTreeNode[],
  };
}
