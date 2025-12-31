import React from "react";
import type { ProjectTreeNode } from "../types/projectTree";

/**
 * `ProjectTree` 组件入参。
 */
type Props = {
  /** 当前节点（文件夹或叶子项目）。 */
  node: ProjectTreeNode;
  /** 当前递归深度（用于缩进）。 */
  depth?: number;
  /** 默认是否展开文件夹节点。 */
  defaultOpen?: boolean;
  /** 选中某个叶子项目时触发。 */
  onSelectProject?: (projectPath: string) => void;
  /** 当前选中的项目路径（用于高亮）。 */
  selectedPath?: string | null;
};

/**
 * 根据树深度计算缩进样式。
 *
 * @param depth 深度（0 为根层）。
 * @returns 对应的内联样式。
 */
function indentStyle(depth: number): React.CSSProperties {
  return { paddingLeft: `${depth * 14}px` };
}

/**
 * 递归渲染项目目录树。
 */
export function ProjectTree(props: Props) {
  const { node, depth = 0, defaultOpen = depth < 2, onSelectProject, selectedPath } = props;

  if (node.type === "project") {
    const isSelected = selectedPath === node.path;

    return (
      <div className={"tree-row tree-project" + (isSelected ? " is-selected" : "")} style={indentStyle(depth)}>
        <button
          className="tree-button"
          type="button"
          onClick={() => onSelectProject?.(node.path)}
          title={node.path}
        >
          <span className="tree-icon">📄</span>
          <span className="tree-name">{node.name}</span>
        </button>
      </div>
    );
  }

  return (
    <details className="tree-details" open={defaultOpen}>
      <summary className="tree-row tree-folder" style={indentStyle(depth)} title={node.path}>
        <span className="tree-icon">📁</span>
        <span className="tree-name">{node.name}</span>
        <span className="tree-meta">{node.children.length}</span>
      </summary>

      <div className="tree-children">
        {node.children.map((child) => (
          <ProjectTree
            key={`${child.type}:${child.path}`}
            node={child}
            depth={depth + 1}
            defaultOpen={defaultOpen}
            onSelectProject={onSelectProject}
            selectedPath={selectedPath}
          />
        ))}
      </div>
    </details>
  );
}

