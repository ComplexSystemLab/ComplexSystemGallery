import React from "react";
import type { GalleryProjectEntry } from "../projectRegistry";

import { BLOCK_CONNECTIVITY_PROJECT_ENTRY, BLOCK_CONNECTIVITY_PROJECT_PATH } from "./block_connectivity/projectEntry";
import { GRAPH_CONNECTIVITY_PROJECT_ENTRY, GRAPH_CONNECTIVITY_PROJECT_PATH } from "./graph_connectivity/projectEntry";
import { POISSON_DISK_PROJECT_ENTRY, POISSON_DISK_PROJECT_PATH } from "./poisson_disk/projectEntry";

/**
 * graph_algorithms-js 的项目路径前缀。
 */
const ROOT_PREFIX = "graph_algorithms-js/projects/";

/**
 * 将 graph_algorithms-js 的叶子项目路径映射到对应的 Gallery 注册条目。
 */
const GRAPH_ALGORITHMS_PROJECT_ENTRY_MAP: Readonly<Record<string, GalleryProjectEntry>> = {
	[BLOCK_CONNECTIVITY_PROJECT_PATH]: BLOCK_CONNECTIVITY_PROJECT_ENTRY,
	[GRAPH_CONNECTIVITY_PROJECT_PATH]: GRAPH_CONNECTIVITY_PROJECT_ENTRY,
	[POISSON_DISK_PROJECT_PATH]: POISSON_DISK_PROJECT_ENTRY,
};

/**
 * 获取 graph_algorithms-js 对应的项目注册项。
 *
 * @param projectPath 项目路径（相对 `Projects` 根目录）。
 * @returns 已注册则返回条目；未注册返回 `null`。
 */
export function getGraphAlgorithmsProjectEntry(projectPath: string): GalleryProjectEntry | null {
	if (!projectPath.startsWith(ROOT_PREFIX)) return null;

	// 这里保留对 React 的引用：即便条目来自子模块，本模块也属于“项目注册入口”。
	void React;

	const entry = GRAPH_ALGORITHMS_PROJECT_ENTRY_MAP[projectPath];
	if (!entry) return null;
	return entry;
}

