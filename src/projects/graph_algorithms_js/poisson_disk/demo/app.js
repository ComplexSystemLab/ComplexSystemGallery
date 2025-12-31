/**
 * poisson_disk 可视化 Demo（Poisson Disk Sampling）。
 *
 * 说明：
 * - 本页面为纯 HTML/JS，依赖 p5.js（CDN）
 * - 算法实现由同目录的 `algorithms.bundle.js` 提供，并挂载在 `window.GA`
 */

/** @type {"poisson"} */
const DEMO = "poisson";

/**
 * 从 `window.GA` 读取算法函数。
 *
 * @type {{
 *   generatePoissonDiskPoints?: Function,
 * }}
 */
const GA = (window.GA || {});

/** @type {(opts: any) => {x:number,y:number}[]} */
const generatePoissonDiskPoints = GA.generatePoissonDiskPoints;

if (!generatePoissonDiskPoints) {
	const msg = "算法未加载：请确认先加载 ./algorithms.bundle.js 再加载 ./app.js";
	console.error(msg);
	const el = document.getElementById("status");
	if (el) el.textContent = msg;
}

/**
 * 生成确定性随机数（mulberry32）。
 *
 * @param {number} seed 随机种子。
 * @returns {() => number} 返回 [0, 1) 的随机函数。
 */
function mulberry32(seed) {
	let t = seed >>> 0;
	return () => {
		t += 0x6d2b79f5;
		let x = Math.imul(t ^ (t >>> 15), 1 | t);
		x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
		return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * 生成随机种子。
 *
 * @returns {number}
 */
function randomSeed() {
	return Math.floor(Math.random() * 1_000_000_000);
}

/**
 * 页面元素引用。
 */
const els = {
	/** @type {HTMLElement|null} */
	status: document.getElementById("status"),
	/** @type {HTMLElement|null} */
	stats: document.getElementById("stats"),
	/** @type {HTMLInputElement|null} */
	seedInput: /** @type {HTMLInputElement|null} */ (document.getElementById("seedInput")),
	/** @type {HTMLButtonElement|null} */
	randomSeedBtn: /** @type {HTMLButtonElement|null} */ (document.getElementById("randomSeedBtn")),
	/** @type {HTMLButtonElement|null} */
	regenBtn: /** @type {HTMLButtonElement|null} */ (document.getElementById("regenBtn")),
	/** @type {HTMLButtonElement|null} */
	resetBtn: /** @type {HTMLButtonElement|null} */ (document.getElementById("resetBtn")),
	/** @type {HTMLElement|null} */
	paramArea: document.getElementById("paramArea"),
	/** @type {HTMLElement|null} */
	canvasMount: document.getElementById("canvas"),
	/** @type {HTMLTextAreaElement|null} */
	output: /** @type {HTMLTextAreaElement|null} */ (document.getElementById("output")),
};

/**
 * 设置状态栏文字。
 *
 * @param {string} t
 */
function setStatus(t) {
	if (els.status) els.status.textContent = t;
}

/**
 * 渲染统计信息。
 *
 * @param {Record<string, any>} obj
 */
function renderStats(obj) {
	if (!els.stats) return;
	const lines = Object.entries(obj).map(([k, v]) => `${k}: ${String(v)}`);
	els.stats.textContent = lines.join("\n");
}

/**
 * 设置输出文本框。
 *
 * @param {string} text
 */
function setOutputText(text) {
	if (!els.output) return;
	els.output.value = String(text ?? "");
	els.output.scrollTop = els.output.scrollHeight;
}

/**
 * 生成 UI 行。
 *
 * @param {string} labelText
 * @param {HTMLElement} inputEl
 * @returns {HTMLDivElement}
 */
function mkRow(labelText, inputEl) {
	const wrap = document.createElement("div");
	wrap.className = "row";
	const label = document.createElement("label");
	label.textContent = labelText;
	wrap.appendChild(label);
	wrap.appendChild(inputEl);
	return wrap;
}

/**
 * 创建数字输入。
 *
 * @param {{value:number,min?:number,max?:number,step?:number}} cfg
 * @param {(v:number)=>void} onChange
 * @returns {HTMLInputElement}
 */
function mkNumber(cfg, onChange) {
	const input = document.createElement("input");
	input.type = "number";
	input.value = String(cfg.value);
	if (cfg.min != null) input.min = String(cfg.min);
	if (cfg.max != null) input.max = String(cfg.max);
	if (cfg.step != null) input.step = String(cfg.step);
	input.addEventListener("input", () => onChange(Number(input.value)));
	return input;
}

/**
 * 创建下拉选择。
 *
 * @param {{value:string,options:{value:string,label:string}[]}} cfg
 * @param {(v:string)=>void} onChange
 * @returns {HTMLSelectElement}
 */
function mkSelect(cfg, onChange) {
	const sel = document.createElement("select");
	for (const opt of cfg.options) {
		const o = document.createElement("option");
		o.value = opt.value;
		o.textContent = opt.label;
		sel.appendChild(o);
	}
	sel.value = cfg.value;
	sel.addEventListener("change", () => onChange(sel.value));
	return sel;
}

/**
 * 读取当前 Seed。
 *
 * @returns {number}
 */
function getSeed() {
	const n = Number(els.seedInput?.value);
	return Number.isFinite(n) ? n : 42;
}

/**
 * 默认参数（只保留 poisson demo 相关参数）。
 */
const defaultParams = {
	poisson: { width: 900, height: 650, radius: 16, k: 30, boundaryType: "rect", circleRadius: 300, maxPoints: 600 },
};

/** @type {{poisson: typeof defaultParams.poisson}} */
let params = JSON.parse(JSON.stringify(defaultParams));

/** @type {any} */
let sketchP5 = null;

/**
 * 运行时数据（点集）。
 */
const runtime = {
	demo: DEMO,
	/** @type {{id:string,x:number,y:number}[]} */
	nodes: [],
};

/**
 * 计算点集的最小距离（用于验证采样结果）。
 *
 * @param {{x:number,y:number}[]} points
 * @returns {number}
 */
function computeMinDist(points) {
	let minDist = Infinity;
	for (let i = 0; i < points.length; i++) {
		for (let j = i + 1; j < points.length; j++) {
			const dx = points[i].x - points[j].x;
			const dy = points[i].y - points[j].y;
			const d = Math.sqrt(dx * dx + dy * dy);
			if (d < minDist) minDist = d;
		}
	}
	return minDist;
}

/**
 * 重新渲染参数输入区。
 */
function rebuildParamUI() {
	if (!els.paramArea) return;
	els.paramArea.innerHTML = "";

	els.paramArea.appendChild(mkRow("Width", mkNumber({ value: params.poisson.width, min: 200, max: 1400, step: 10 }, (v) => (params.poisson.width = v))));
	els.paramArea.appendChild(mkRow("Height", mkNumber({ value: params.poisson.height, min: 200, max: 1000, step: 10 }, (v) => (params.poisson.height = v))));
	els.paramArea.appendChild(mkRow("Radius", mkNumber({ value: params.poisson.radius, min: 2, max: 60, step: 1 }, (v) => (params.poisson.radius = v))));
	els.paramArea.appendChild(mkRow("k (attempts)", mkNumber({ value: params.poisson.k, min: 1, max: 60, step: 1 }, (v) => (params.poisson.k = v))));
	els.paramArea.appendChild(
		mkRow(
			"Boundary",
			mkSelect(
				{ value: params.poisson.boundaryType, options: [{ value: "rect", label: "rect" }, { value: "circle", label: "circle" }] },
				(v) => (params.poisson.boundaryType = v)
			)
		)
	);
	els.paramArea.appendChild(
		mkRow("Circle radius", mkNumber({ value: params.poisson.circleRadius, min: 20, max: 800, step: 5 }, (v) => (params.poisson.circleRadius = v)))
	);
	els.paramArea.appendChild(mkRow("Max points", mkNumber({ value: params.poisson.maxPoints, min: 10, max: 5000, step: 10 }, (v) => (params.poisson.maxPoints = v))));
}

/**
 * 调整画布尺寸。
 *
 * @param {number} w
 * @param {number} h
 */
function resizeCanvas(w, h) {
	if (!sketchP5) return;
	sketchP5.resizeCanvas(Math.max(200, Math.floor(w)), Math.max(200, Math.floor(h)));
}

/**
 * 触发重绘。
 */
function redraw() {
	if (!sketchP5) return;
	sketchP5.redraw();
}

/**
 * 运行算法并更新可视化。
 */
function regen() {
	setStatus("running…");
	const seed = getSeed();
	const rng = mulberry32(seed);
	const p = params.poisson;

	const pts = generatePoissonDiskPoints({
		width: p.width,
		height: p.height,
		radius: p.radius,
		k: p.k,
		boundaryType: p.boundaryType,
		centerX: p.width / 2,
		centerY: p.height / 2,
		circleRadius: p.circleRadius,
		maxPoints: p.maxPoints,
		rng,
	});

	runtime.nodes = pts.map((pt, i) => ({ id: `p${i}`, x: pt.x, y: pt.y }));

	const minDist = pts.length >= 2 ? computeMinDist(pts) : Infinity;
	renderStats({ demo: DEMO, seed, at: new Date().toLocaleTimeString(), points: pts.length, radius: p.radius, boundary: p.boundaryType, minDist });
	setOutputText(
		JSON.stringify(
			{
				demo: DEMO,
				seed,
				points: pts.length,
				radius: p.radius,
				boundaryType: p.boundaryType,
				minDist,
				firstPoints: pts.slice(0, 10),
			},
			null,
			2
		)
	);

	resizeCanvas(p.width, p.height);
	redraw();
	setStatus("ready");
}

/**
 * 启动页面。
 */
function boot() {
	setStatus("initializing…");

	els.regenBtn?.addEventListener("click", () => regen());
	els.resetBtn?.addEventListener("click", () => {
		params = JSON.parse(JSON.stringify(defaultParams));
		rebuildParamUI();
		regen();
	});
	els.randomSeedBtn?.addEventListener("click", () => {
		if (els.seedInput) els.seedInput.value = String(randomSeed());
		regen();
	});

	sketchP5 = new window.p5((p) => {
		p.setup = () => {
			p.createCanvas(defaultParams.poisson.width, defaultParams.poisson.height).parent(els.canvasMount);
			p.pixelDensity(1);
			p.noLoop();
			rebuildParamUI();
			regen();
		};

		p.draw = () => {
			p.background(18);

			p.push();
			p.noStroke();
			p.fill("rgba(240,240,240,0.95)");
			for (const n of runtime.nodes) p.circle(n.x, n.y, 8);
			p.pop();

			p.push();
			p.noFill();
			p.stroke("rgba(200,200,200,0.35)");
			if (params.poisson.boundaryType === "rect") {
				p.rect(0, 0, params.poisson.width, params.poisson.height);
			} else {
				p.circle(params.poisson.width / 2, params.poisson.height / 2, params.poisson.circleRadius * 2);
			}
			p.pop();
		};
	}, els.canvasMount);

	setStatus("ready");
}

boot();

