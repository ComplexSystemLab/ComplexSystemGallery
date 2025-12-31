import React from "react";
import "./App.css";
import type { ProjectTree as ProjectTreeType } from "./types/projectTree";
import { ProjectTree } from "./components/ProjectTree";
import { filterProjectTreeForGallery } from "./projects/projectRegistry";

/**
 * `App` 组件入参。
 */
type Props = {
  /**
   * 打开某个具体项目页。
   *
   * @param projectPath 项目路径（相对 `Projects` 根目录）
   */
  onOpenProject: (projectPath: string) => void;
};

/**
 * 项目树主界面。
 *
 * - 仅负责展示树与导航
 * - 具体项目交互界面由路由切换到 `ProjectPage`
 */
export default function App(props: Props) {
  const { onOpenProject } = props;

  /** 原始项目树数据（来自 `public/projects-tree.json`）。 */
  const [tree, setTree] = React.useState<ProjectTreeType | null>(null);
  /** 加载错误信息。 */
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    /** 标记 effect 是否已被卸载，避免 setState 泄露。 */
    let canceled = false;

    /**
     * 加载项目树 JSON。
     */
    async function load() {
      try {
        const res = await fetch("/projects-tree.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`加载 projects-tree.json 失败: ${res.status}`);

        const data = (await res.json()) as ProjectTreeType;
        if (!canceled) setTree(filterProjectTreeForGallery(data));
      } catch (e) {
        if (!canceled) setError(e instanceof Error ? e.message : String(e));
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-title">ComplexSystemGallery</div>
        <div className="app-subtitle">
          从 <code>ComplexSystemLab/ComplexSystemLab/Projects</code> 索引：仅将包含 <code>project.txt</code> 的文件夹视为项目叶子
        </div>
      </header>

      <main className="app-main">
        <section className="left-pane" style={{ gridColumn: "1 / -1" }}>
          <div className="pane-title">项目目录树</div>

          {error ? <div className="error-box">{error}</div> : null}
          {!tree && !error ? <div className="loading-box">加载中…</div> : null}

          {tree ? (
            <>
              <div className="tree-hint">
                <span className="tree-hint-label">数据源：</span>
                <code>{tree.source}</code>
                <span className="tree-hint-sep">·</span>
                <span className="tree-hint-label">生成时间：</span>
                <code>{tree.generatedAt}</code>
              </div>

              <div className="tree-root">
                {tree.children.map((n) => (
                  <ProjectTree
                    key={`${n.type}:${n.path}`}
                    node={n}
                    onSelectProject={(p) => {
                      onOpenProject(p);
                    }}
                  />
                ))}
              </div>
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}
