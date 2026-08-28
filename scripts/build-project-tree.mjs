import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ComplexSystemGallery/
const GALLERY_ROOT = path.resolve(__dirname, "..");
// parent of ComplexSystemGallery (ComplexSystemLab and ComplexSystemGallery are siblings)
const PARENT_ROOT = path.resolve(GALLERY_ROOT, "..");

// ComplexSystemLab/ComplexSystemLab/Projects
const LAB_PROJECTS_ROOT = path.resolve(
  PARENT_ROOT,
  "ComplexSystemLab",
  "ComplexSystemLab",
  "Projects",
);

const OUTPUT_PATH = path.resolve(GALLERY_ROOT, "public", "projects-tree.json");

function isDirectory(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function hasProjectTxt(dirPath) {
  return isFile(path.join(dirPath, "project.txt"));
}

function listSubDirs(dirPath) {
  let entries = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const IGNORED = new Set([
    "node_modules",
    "dist",
    "build",
    "__pycache__",
    ".git",
    ".idea",
  ]);

  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !name.startsWith(".") && !IGNORED.has(name));
}

function listDirectFiles(dirPath) {
  let entries = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
}

function listProjectFiles(dirPath) {
  return listDirectFiles(dirPath)
    .filter((name) => !name.startsWith("."))
    .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))
    .slice(0, 20);
}

function pickHtmlEntryFile(dirPath) {
  const htmlFiles = listDirectFiles(dirPath)
    .filter((name) => name.toLowerCase().endsWith(".html"))
    .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));

  if (htmlFiles.length === 0) return null;

  const preferred = ["index.html", "index_p5.html", "index_q5.html", "index_pixi.html"];
  for (const candidate of preferred) {
    const found = htmlFiles.find((name) => name.toLowerCase() === candidate);
    if (found) return found;
  }

  const indexLike = htmlFiles.find((name) => name.toLowerCase().startsWith("index_"));
  if (indexLike) return indexLike;

  return htmlFiles[0];
}

function normalizeRelPath(rel) {
  return rel.replaceAll("\\", "/");
}

function toProjectSourceUrl(relPath) {
  return `/projects-src/${normalizeRelPath(relPath)}`;
}

function buildNode(absDir, relFromProjectsRoot) {
  const name = path.basename(absDir);
  const hasProjectMarker = hasProjectTxt(absDir);
  const htmlEntryFile = pickHtmlEntryFile(absDir);

  const children = [];
  for (const sub of listSubDirs(absDir)) {
    const childAbs = path.join(absDir, sub);
    if (!isDirectory(childAbs)) continue;

    const childRel = path.join(relFromProjectsRoot, sub);
    const childNode = buildNode(childAbs, childRel);
    if (childNode) children.push(childNode);
  }

  if (hasProjectMarker && children.length > 0) {
    children.sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));
    return {
      type: "folder",
      name,
      path: normalizeRelPath(relFromProjectsRoot),
      children,
      projectMarker: true,
    };
  }

  if (hasProjectMarker || htmlEntryFile) {
    const projectNode = {
      type: "project",
      name,
      path: normalizeRelPath(relFromProjectsRoot),
      detectedBy: hasProjectMarker ? "project.txt" : "html-entry",
      projectFiles: listProjectFiles(absDir),
    };

    if (htmlEntryFile) {
      return {
        ...projectNode,
        autoDemoUrl: toProjectSourceUrl(path.join(relFromProjectsRoot, htmlEntryFile)),
      };
    }

    return projectNode;
  }

  if (children.length === 0) return null;

  children.sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));

  return {
    type: "folder",
    name,
    path: normalizeRelPath(relFromProjectsRoot),
    children,
  };
}

function main() {
  if (!isDirectory(LAB_PROJECTS_ROOT)) {
    console.error(`找不到目录: ${LAB_PROJECTS_ROOT}`);
    process.exit(1);
  }

  const root = {
    type: "root",
    name: "Projects",
    path: "",
    children: [],
    generatedAt: new Date().toISOString(),
    source: normalizeRelPath(path.relative(PARENT_ROOT, LAB_PROJECTS_ROOT)),
  };

  for (const sub of listSubDirs(LAB_PROJECTS_ROOT)) {
    const abs = path.join(LAB_PROJECTS_ROOT, sub);
    const node = buildNode(abs, sub);
    if (node) root.children.push(node);
  }

  root.children.sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(root, null, 2), "utf8");
  console.log(`已生成: ${OUTPUT_PATH}`);
}

main();

