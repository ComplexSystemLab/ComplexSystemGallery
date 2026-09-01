/// <reference types="vite/client" />

/**
 * p5.js v1 无内置 TypeScript 声明。
 * 此处提供最小化模块声明，仅覆盖宿主实际使用的构造器导出。
 */
declare module "p5" {
  const p5: new (sketch: (p: unknown) => void, container?: HTMLElement) => unknown;
  export default p5;
}