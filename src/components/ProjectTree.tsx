import React from "react";
import type { ProjectTreeNode } from "../types/projectTree";

type Props = {
  node: ProjectTreeNode;
  depth?: number;
  defaultOpen?: boolean;
  onSelectProject?: (projectPath: string) => void;
  selectedPath?: string | null;
};

function indentStyle(depth: number): React.CSSProperties {
  return { paddingLeft: `${depth * 14}px` };
}

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

