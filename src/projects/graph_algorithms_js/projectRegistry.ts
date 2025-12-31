import React from "react";
import type { GalleryProjectEntry } from "../projectRegistry";

/**
 * graph_algorithms-js 的项目路径前缀。
 */
const ROOT_PREFIX = "graph_algorithms-js/projects/";

/**
 * 将 graph_algorithms-js 的叶子项目映射到 Gallery 中的静态 Demo URL。
 */
const PROJECT_TO_DEMO_URL: Record<string, { title: string; url: string }> = {
	"graph_algorithms-js/projects/block_connectivity": {
		title: "block_connectivity（方块连通性）",
		url: "/demos/graph_algorithms_js/block/index.html",
	},
	"graph_algorithms-js/projects/graph_connectivity": {
		title: "graph_connectivity（图连通性）",
		url: "/demos/graph_algorithms_js/graph/index.html",
	},
	"graph_algorithms-js/projects/poisson_disk": {
		title: "poisson_disk（泊松圆盘采样）",
		url: "/demos/graph_algorithms_js/poisson/index.html",
	},
};

/**
 * 获取 graph_algorithms-js 对应的项目注册项。
 *
 * @param projectPath 项目路径（相对 `Projects` 根目录）。
 * @returns 已注册则返回条目；未注册返回 `null`。
 */
export function getGraphAlgorithmsProjectEntry(projectPath: string): GalleryProjectEntry | null {
	if (!projectPath.startsWith(ROOT_PREFIX)) return null;
	const mapped = PROJECT_TO_DEMO_URL[projectPath];
	if (!mapped) return null;

	return {
		projectPath,
		title: mapped.title,
		visibleInTree: true,
		render: () =>
			React.createElement("iframe", {
				title: mapped.title,
				src: mapped.url,
				className: "project-iframe",
				loading: "lazy",
				referrerPolicy: "no-referrer",
			}),
	};
}

