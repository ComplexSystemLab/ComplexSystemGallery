import React from "react";
import "./App.css";
import type { ProjectTree as ProjectTreeType } from "./types/projectTree";
import { ProjectTree } from "./components/ProjectTree";

export default function App() {
  const [tree, setTree] = React.useState<ProjectTreeType | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);

  React.useEffect(() => {
    let canceled = false;

    async function load() {
      try {
        const res = await fetch("/projects-tree.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`加载 projects-tree.json 失败: ${res.status}`);

        const data = (await res.json()) as ProjectTreeType;
        if (!canceled) setTree(data);
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
        <section className="left-pane">
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
                    onSelectProject={setSelected}
                    selectedPath={selected}
                  />
                ))}
              </div>
            </>
          ) : null}
        </section>

        <section className="right-pane">
          <div className="pane-title">详情</div>

          {selected ? (
            <div className="detail-box">
              <div className="detail-label">已选择项目（相对 Projects 根路径）：</div>
              <code className="detail-path">{selected}</code>

              <div className="detail-actions">
                <button
                  type="button"
                  className="mini-btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(selected);
                    } catch {
                      // ignore
                    }
                  }}
                >
                  复制路径
                </button>
              </div>

              <div className="detail-note">
                下一步你可以在这里：读取该目录下的 README / project.txt
                <br />
                或根据路径加载对应 demo（比如 viz/index.html）。
              </div>
            </div>
          ) : (
            <div className="detail-box muted">点击左侧叶子项目（包含 project.txt 的文件夹）以查看路径。</div>
          )}
        </section>
      </main>
    </div>
  );
}
