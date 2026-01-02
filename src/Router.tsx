import React from "react";
import App from "./App";
import { ProjectPage } from "./projects/ProjectPage";

/**
 * 路由状态。
 *
 * - `home`：项目树主界面
 * - `project`：某个具体项目的交互界面
 */
type Route =
  | {
      /** 路由类型：项目树主页。 */
      kind: "home";
    }
  | {
      /** 路由类型：具体项目页。 */
      kind: "project";
      /** 项目路径（相对 `Projects` 根目录）。 */
      projectPath: string;
    };

/**
 * 从浏览器地址栏解析路由。
 */
function parseRoute(location: Location): Route {
  if (location.pathname === "/project") {
    const sp = new URLSearchParams(location.search);
    const projectPath = sp.get("path")?.trim();
    if (projectPath) return { kind: "project", projectPath };
  }
  return { kind: "home" };
}

function gotoProject(projectPath: string) {
  const url = `/project?path=${encodeURIComponent(projectPath)}`;
  window.history.pushState({}, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function gotoHome() {
  window.history.pushState({}, "", "/");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/**
 * 轻量级前端路由：
 * - `/` 显示项目树
 * - `/project?path=...` 显示具体项目
 */
export function Router() {
  /** 当前路由（来源于 `window.location`）。 */
  const [route, setRoute] = React.useState<Route>(() => parseRoute(window.location));

  React.useEffect(() => {
    /** 监听浏览器前进/后退以及内部导航触发的 `popstate`。 */
    function onPopState() {
      setRoute(parseRoute(window.location));
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  if (route.kind === "project") {
    return <ProjectPage projectPath={route.projectPath} onBack={gotoHome} />;
  }

  return <App onOpenProject={gotoProject} />;
}

