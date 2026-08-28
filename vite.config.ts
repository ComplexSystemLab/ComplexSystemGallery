import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sirv from "sirv";
import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";

/**
 * `vite.config.ts` 所在目录（兼容 ESM：通过 `import.meta.url` 推导）。
 */
const CONFIG_DIR = path.dirname(fileURLToPath(import.meta.url));
const LAB_PROJECTS_ROOT = path.resolve(
  CONFIG_DIR,
  "..",
  "ComplexSystemLab",
  "ComplexSystemLab",
  "Projects",
);

/**
 * 单个探索项目的静态 Demo 映射配置。
 */
type ProjectDemoMapping = {
  /**
   * 对外暴露的 URL 前缀（必须以 `/` 开头、以 `/` 结尾）。
   *
   * 例如：`/demos/graph_algorithms_js/block_connectivity/`
   */
  urlPrefix: string;
  /**
   * Demo 文件夹的绝对路径。
   */
  dirPath: string;
};

/**
 * 递归收集某个目录下的所有文件路径。
 *
   * @param rootDir 根目录。
   * @returns 文件路径列表（绝对路径）。
 */
function listFilesRecursively(rootDir: string): string[] {
  /**
   * 递归扫描目录。
   *
   * @param currentDir 当前扫描目录。
   * @param out 输出数组。
   */
  function walk(currentDir: string, out: string[]): void {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, out);
        continue;
      }
      if (entry.isFile()) out.push(fullPath);
    }
  }

  const files: string[] = [];
  if (!fs.existsSync(rootDir)) return files;
  walk(rootDir, files);
  return files;
}

/**
 * 将 `src/projects/<project>/demo` 里的静态 Demo：
 * - 开发态：挂载到指定 URL 前缀下直接访问（无需放到 `public/`）。
 * - 构建态：把 Demo 文件原样输出到 `dist/`，保证生产环境 iframe URL 可用。
 *
   * @param mappings Demo 映射配置。
   * @returns Vite 插件。
 */
function projectDemosPlugin(mappings: readonly ProjectDemoMapping[]): Plugin {
  return {
    name: "project-demos",
    apply: "serve",
    configureServer(server) {
      for (const mapping of mappings) {
        // 通过 sirv 挂载静态目录（connect 中间件）。
        server.middlewares.use(mapping.urlPrefix, sirv(mapping.dirPath, { dev: true }));
      }
    },
  };
}

/**
 * 构建态把探索项目 Demo 原样写入 `dist/`。
 */
function projectDemosEmitPlugin(mappings: readonly ProjectDemoMapping[]): Plugin {
  /**
   * 将 URL 前缀转换为 dist 内的输出目录。
   *
   * 例如：`/demos/graph_algorithms_js/block_connectivity/` -> `demos/graph_algorithms_js/block_connectivity`
   *
   * @param urlPrefix URL 前缀。
   * @returns 输出目录（POSIX）。
   */
  function urlPrefixToOutDir(urlPrefix: string): string {
    const trimmed = urlPrefix.replace(/^\/+/, "").replace(/\/+$/, "");
    return trimmed;
  }

  /**
   * 将任意路径片段转换为 POSIX 风格。
   *
   * @param input 输入路径。
   * @returns POSIX 风格路径。
   */
  function toPosixPath(input: string): string {
    return input.split(path.sep).join(path.posix.sep);
  }

  return {
    name: "project-demos-emit",
    apply: "build",
    generateBundle() {
      for (const mapping of mappings) {
        const files = listFilesRecursively(mapping.dirPath);
        const outDir = urlPrefixToOutDir(mapping.urlPrefix);

        for (const absFile of files) {
          const relFile = path.relative(mapping.dirPath, absFile);
          const outFileName = path.posix.join(outDir, toPosixPath(relFile));
          this.emitFile({
            type: "asset",
            fileName: outFileName,
            source: fs.readFileSync(absFile),
          });
        }
      }
    },
  };
}

/**
 * 将外部 Lab Projects 目录挂载为只读静态资源，用于自动发现的 html 入口预览。
 */
function externalProjectsSourcePlugin(projectsRoot: string, urlPrefix = "/projects-src/"): Plugin {
  return {
    name: "external-projects-source",
    configureServer(server) {
      if (!fs.existsSync(projectsRoot)) return;
      server.middlewares.use(urlPrefix, sirv(projectsRoot, { dev: true }));
    },
    configurePreviewServer(server) {
      if (!fs.existsSync(projectsRoot)) return;
      server.middlewares.use(urlPrefix, sirv(projectsRoot, { dev: false }));
    },
  };
}

/**
 * graph_algorithms_js 下三个探索项目的 Demo 映射。
 */
const GRAPH_ALGORITHMS_DEMO_MAPPINGS: readonly ProjectDemoMapping[] = [
  {
    urlPrefix: "/demos/graph_algorithms_js/block_connectivity/",
    dirPath: path.resolve(
      CONFIG_DIR,
      "src/projects/graph_algorithms_js/block_connectivity/demo",
    ),
  },
  {
    urlPrefix: "/demos/graph_algorithms_js/graph_connectivity/",
    dirPath: path.resolve(
      CONFIG_DIR,
      "src/projects/graph_algorithms_js/graph_connectivity/demo",
    ),
  },
  {
    urlPrefix: "/demos/graph_algorithms_js/poisson_disk/",
    dirPath: path.resolve(CONFIG_DIR, "src/projects/graph_algorithms_js/poisson_disk/demo"),
  },
];

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4174,
    strictPort: true,
  },
  resolve: {
    dedupe: ["vue"],
    alias: [],
  },
  plugins: [
    vue(),
    externalProjectsSourcePlugin(LAB_PROJECTS_ROOT),
    projectDemosPlugin(GRAPH_ALGORITHMS_DEMO_MAPPINGS),
    projectDemosEmitPlugin(GRAPH_ALGORITHMS_DEMO_MAPPINGS),
  ],
});
