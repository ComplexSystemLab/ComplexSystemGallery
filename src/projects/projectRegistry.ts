import type { ProjectTree, ProjectTreeNode } from "../types/projectTree";
import type React from "react";
import { getGraphAlgorithmsProjectEntry } from "./graph_algorithms_js/projectRegistry";

/**
 * 项目页渲染上下文。
 */
export type ProjectRenderContext = {
  /** 项目路径（相对 `Projects` 根目录）。 */
  projectPath: string;
};

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
  /** 渲染项目交互界面。 */
  render: (ctx: ProjectRenderContext) => React.ReactNode;
};

/**
 * 是否在树中展示“未注册项目”。
 *
 * - `false`：只展示已注册项目（默认）
 * - `true`：展示所有项目（未注册项目点击后会显示“未实现/未展示”提示）
 */
export const SHOW_UNREGISTERED_PROJECTS_IN_TREE = true;

/**
 * 读取某个项目的注册信息。
 *
 * @param projectPath 项目路径（相对 `Projects` 根目录）。
 * @returns 注册信息；如果未注册则返回 `null`。
 */
export function getGalleryProjectEntry(projectPath: string): GalleryProjectEntry | null {
  return getGraphAlgorithmsProjectEntry(projectPath);
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
