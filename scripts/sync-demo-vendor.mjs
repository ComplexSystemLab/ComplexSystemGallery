import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const SOURCE_FILE = path.resolve(REPO_ROOT, "node_modules/p5/lib/p5.min.js");
const TARGET_FILE = path.resolve(REPO_ROOT, "public/vendor/p5.min.js");

if (!fs.existsSync(SOURCE_FILE)) {
  throw new Error(`未找到 p5 本地资源：${SOURCE_FILE}。请先执行 pnpm install。`);
}

fs.mkdirSync(path.dirname(TARGET_FILE), { recursive: true });
fs.copyFileSync(SOURCE_FILE, TARGET_FILE);

console.log(`已同步 demo vendor: ${TARGET_FILE}`);