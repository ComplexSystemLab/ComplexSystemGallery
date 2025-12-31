import React from "react";
import "./ProjectPage.css";
import { getGalleryProjectEntry } from "./projectRegistry";

/**
 * `ProjectPage` 组件入参。
 */
export type ProjectPageProps = {
	/** 项目路径（相对 `Projects` 根目录）。 */
	projectPath: string;
	/** 返回项目树主页。 */
	onBack: () => void;
};

/**
 * 具体项目交互界面页面。
 *
 * - 顶部提供“返回”按钮
 * - 内容区域由注册表决定如何渲染（iframe/React 组件等）
 */
export function ProjectPage(props: ProjectPageProps) {
	const { projectPath, onBack } = props;

	/** 项目注册信息（决定是否可展示以及如何渲染）。 */
	const entry = React.useMemo(() => getGalleryProjectEntry(projectPath), [projectPath]);

	return (
		<div className="project-shell">
			<header className="project-topbar">
				<button type="button" className="project-back" onClick={onBack} aria-label="返回项目树">
					← 返回
				</button>

				<div className="project-title" title={projectPath}>
					{entry?.title ?? projectPath}
				</div>

				<div className="project-actions">
					<a className="project-link" href={`/project?path=${encodeURIComponent(projectPath)}`}>
						固定链接
					</a>
				</div>
			</header>

			<main className="project-main">
				{entry ? (
					entry.render({ projectPath })
				) : (
					<div className="project-empty">
						<div className="project-empty-title">该项目当前未在 Gallery 中展示</div>
						<div className="project-empty-subtitle">
							项目是独立的：只有在 `src/projects/*` 注册后才会显示/可交互。
						</div>
						<code className="project-empty-path">{projectPath}</code>
					</div>
				)}
			</main>
		</div>
	);
}

