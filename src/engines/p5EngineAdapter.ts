import type { ExternalEngineApi } from "@main-ui/view-host-engine";

/**
 * p5 实例的最小类型。
 *
 * p5 v1 不自带 TypeScript 声明文件，此处仅声明宿主实际使用的接口子集，
 * 避免引入 `@types/p5` 的额外依赖。
 */
type P5Instance = {
  width: number;
  height: number;
  mouseX: number;
  mouseY: number;
  frameCount: number;
  setup: () => void;
  draw: () => void;
  createCanvas(w: number, h: number): void;
  resizeCanvas(w: number, h: number): void;
  background(...args: number[]): void;
  fill(...args: number[]): void;
  noFill(): void;
  stroke(...args: number[]): void;
  noStroke(): void;
  strokeWeight(w: number): void;
  ellipse(x: number, y: number, w: number, h?: number): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  dist(x1: number, y1: number, x2: number, y2: number): number;
  map(value: number, start1: number, stop1: number, start2: number, stop2: number): number;
  random(min: number, max?: number): number;
  remove(): void;
};

type P5Constructor = new (sketch: (p: P5Instance) => void, container: HTMLElement) => P5Instance;

/**
 * 网络粒子节点。
 */
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

/**
 * 创建 p5 网络粒子引擎。
 *
 * 实现 `ExternalEngineApi` 契约：
 * - `mount`：在指定容器内创建 p5 实例，绘制网络粒子系统；
 * - `onResize`：同步 p5 画布尺寸；
 * - `destroy`：幂等销毁 p5 实例。
 *
 * 可视化内容：若干粒子在二维空间中运动，距离较近的粒子之间会绘制连线，
 * 模拟复杂网络中节点自组织连接的效果。
 *
 * @param particleCount 粒子数量，默认 60。
 * @returns ExternalEngineApi 实现。
 */
export function createP5NetworkEngine(particleCount = 60): ExternalEngineApi {
  let instance: P5Instance | null = null;
  let containerWidth = 0;
  let containerHeight = 0;
  const particles: Particle[] = [];
  const CONNECTION_DIST = 120;

  function initParticles(w: number, h: number, p: P5Instance): void {
    particles.length = 0;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: p.random(0, w),
        y: p.random(0, h),
        vx: p.random(-0.6, 0.6),
        vy: p.random(-0.6, 0.6),
        radius: p.random(3, 7),
      });
    }
  }

  return {
    mount(container: HTMLElement): void {
      containerWidth = container.clientWidth || 800;
      containerHeight = container.clientHeight || 600;

      // 动态导入 p5（UMD → Vite 自动 CJS 互操作）
      import("p5").then((mod) => {
        const P5Ctor = (mod.default ?? mod) as P5Constructor;

        instance = new P5Ctor((p: P5Instance) => {
          p.setup = () => {
            p.createCanvas(containerWidth, containerHeight);
            initParticles(containerWidth, containerHeight, p);
          };

          p.draw = () => {
            p.background(248, 250, 252);

            // 更新粒子位置
            for (const pt of particles) {
              pt.x += pt.vx;
              pt.y += pt.vy;
              if (pt.x < 0 || pt.x > p.width) pt.vx *= -1;
              if (pt.y < 0 || pt.y > p.height) pt.vy *= -1;
              pt.x = Math.max(0, Math.min(p.width, pt.x));
              pt.y = Math.max(0, Math.min(p.height, pt.y));
            }

            // 绘制连线
            p.strokeWeight(1);
            for (let i = 0; i < particles.length; i++) {
              for (let j = i + 1; j < particles.length; j++) {
                const d = p.dist(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                if (d < CONNECTION_DIST) {
                  const alpha = p.map(d, 0, CONNECTION_DIST, 120, 10);
                  p.stroke(60, 120, 200, alpha);
                  p.line(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                }
              }
            }

            // 绘制粒子
            p.noStroke();
            for (const pt of particles) {
              p.fill(30, 90, 180, 200);
              p.ellipse(pt.x, pt.y, pt.radius * 2);
            }

            // 鼠标交互：鼠标附近粒子加速变色
            if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
              for (const pt of particles) {
                const d = p.dist(pt.x, pt.y, p.mouseX, p.mouseY);
                if (d < 80) {
                  p.fill(220, 100, 50, 180);
                  p.ellipse(pt.x, pt.y, pt.radius * 3);
                  pt.vx += (pt.x - p.mouseX) * 0.002;
                  pt.vy += (pt.y - p.mouseY) * 0.002;
                }
              }
            }
          };
        }, container);
      }).catch(() => {
        container.innerHTML =
          '<div style="display:grid;place-items:center;height:100%;color:var(--mui-color-text-muted,#888)">p5.js load failed</div>';
      });
    },

    onResize(width: number, height: number): void {
      containerWidth = width;
      containerHeight = height;
      if (instance) {
        instance.resizeCanvas(width, height);
      }
    },

    destroy(): void {
      if (instance) {
        instance.remove();
        instance = null;
      }
      particles.length = 0;
    },
  };
}
