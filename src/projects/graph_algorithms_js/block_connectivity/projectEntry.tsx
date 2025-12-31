import React from "react";
import type { GalleryProjectEntry, ProjectRenderContext } from "../../projectRegistry";

/**
 * block_connectivity（方块连通性）探索项目在 Projects 树中的路径。
 */
export const BLOCK_CONNECTIVITY_PROJECT_PATH = "graph_algorithms-js/projects/block_connectivity";

/**
 * block_connectivity（方块连通性）探索项目在 Gallery 中对应的静态 Demo 页面 URL。
 */
export const BLOCK_CONNECTIVITY_DEMO_URL = "/demos/graph_algorithms_js/block_connectivity/index.html";

/**
 * block_connectivity（方块连通性）探索项目的 Gallery 注册条目。
 */
export const BLOCK_CONNECTIVITY_PROJECT_ENTRY: GalleryProjectEntry = {
	/** 项目路径（用于与 `projects-tree.json` 的叶子节点匹配）。 */
	projectPath: BLOCK_CONNECTIVITY_PROJECT_PATH,
	/** 项目标题（用于项目页顶部显示）。 */
	title: "block_connectivity（方块连通性）",
	/** 是否在项目树中展示该项目。 */
	visibleInTree: true,
	/** 渲染项目交互界面。 */
	render: (ctx: ProjectRenderContext) => {
		void ctx;
		return React.createElement("iframe", {
			title: "block_connectivity（方块连通性）",
			src: BLOCK_CONNECTIVITY_DEMO_URL,
			className: "project-iframe",
			loading: "lazy",
			referrerPolicy: "no-referrer",
		});
	},
};
