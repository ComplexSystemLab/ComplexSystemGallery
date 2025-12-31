/**
 * graph_connectivity 可视化 Demo（Graph Connectivity）。
 *
 * 说明：
 * - 本页面为纯 HTML/JS，依赖 p5.js（CDN）
 * - 算法实现由同目录的 `algorithms.bundle.js` 提供，并挂载在 `window.GA`
 */

/** @type {"graph"} */
const DEMO = "graph";

/**
 * 从 `window.GA` 读取算法函数。
 *
 * @type {{
 *   buildNonIntersectingEdgesGeneric?: Function,
 * }}
 */
const GA = (window.GA || {});

/** @type {(nodes: any[], opts: any, geom: any) => any[]} */
const buildNonIntersectingEdgesGeneric = GA.buildNonIntersectingEdgesGeneric;

if (!buildNonIntersectingEdgesGeneric) {
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
 * 简单几何工具：距离平方 + 线段相交判定。
 */
const geom = {
	/**
	 * @param {{x:number,y:number}} a
	 * @param {{x:number,y:number}} b
	 * @returns {number}
	 */
	distance2: (a, b) => {
		const dx = a.x - b.x;
		const dy = a.y - b.y;
		return dx * dx + dy * dy;
	},
	/**
	 * @param {{x:number,y:number}} a
	 * @param {{x:number,y:number}} b
	 * @param {{x:number,y:number}} c
	 * @param {{x:number,y:number}} d
	 * @returns {boolean}
	 */
	segmentsIntersect: (a, b, c, d) => {
		const o = (p, q, r) => (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
		const onSegment = (p, q, r) =>
			Math.min(p.x, r.x) <= q.x && q.x <= Math.max(p.x, r.x) && Math.min(p.y, r.y) <= q.y && q.y <= Math.max(p.y, r.y);

		const o1 = o(a, b, c);
		const o2 = o(a, b, d);
		const o3 = o(c, d, a);
		const o4 = o(c, d, b);

		if (o1 * o2 < 0 && o3 * o4 < 0) return true;
		if (o1 === 0 && onSegment(a, c, b)) return true;
		if (o2 === 0 && onSegment(a, d, b)) return true;
		if (o3 === 0 && onSegment(c, a, d)) return true;
		if (o4 === 0 && onSegment(c, b, d)) return true;
		return false;
	},
};

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
 * 创建复选框。
 *
 * @param {{checked:boolean}} cfg
 * @param {(v:boolean)=>void} onChange
 * @returns {HTMLInputElement}
 */
function mkCheckbox(cfg, onChange) {
	const input = document.createElement("input");
	input.type = "checkbox";
	input.checked = cfg.checked;
	input.addEventListener("change", () => onChange(input.checked));
	return input;
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
 * 默认参数（只保留 graph demo 相关参数）。
 */
const defaultParams = {
	graph: { width: 900, height: 650, n: 60, maxDegree: 3, maxNeighbors: 8, maxEdgeLength: 160, preferConnected: true },
};

/** @type {{graph: typeof defaultParams.graph}} */
let params = JSON.parse(JSON.stringify(defaultParams));

/** @type {any} */
let sketchP5 = null;

/**
 * 运行时数据（节点/边）。
 */
const runtime = {
	demo: DEMO,
	/** @type {{id:string,x:number,y:number}[]} */
	nodes: [],
	/** @type {{from:string,to:string}[]} */
	edges: [],
};

/**
 * 重新渲染参数输入区。
 */
function rebuildParamUI() {
	if (!els.paramArea) return;
	els.paramArea.innerHTML = "";

	els.paramArea.appendChild(mkRow("Width", mkNumber({ value: params.graph.width, min: 200, max: 1400, step: 10 }, (v) => (params.graph.width = v))));
	els.paramArea.appendChild(mkRow("Height", mkNumber({ value: params.graph.height, min: 200, max: 1000, step: 10 }, (v) => (params.graph.height = v))));
	els.paramArea.appendChild(mkRow("Node count", mkNumber({ value: params.graph.n, min: 5, max: 400, step: 1 }, (v) => (params.graph.n = v))));
	els.paramArea.appendChild(mkRow("Max degree", mkNumber({ value: params.graph.maxDegree, min: 1, max: 10, step: 1 }, (v) => (params.graph.maxDegree = v))));
	els.paramArea.appendChild(mkRow("Max neighbors", mkNumber({ value: params.graph.maxNeighbors, min: 2, max: 40, step: 1 }, (v) => (params.graph.maxNeighbors = v))));
	els.paramArea.appendChild(
		mkRow("Max edge length", mkNumber({ value: params.graph.maxEdgeLength, min: 10, max: 600, step: 5 }, (v) => (params.graph.maxEdgeLength = v)))
	);
	els.paramArea.appendChild(mkRow("Prefer connected", mkCheckbox({ checked: params.graph.preferConnected }, (v) => (params.graph.preferConnected = v))));
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
	const p = params.graph;

	const nodes = [];
	for (let i = 0; i < p.n; i++) {
		nodes.push({ id: `n${i}`, point: { x: rng() * p.width, y: rng() * p.height } });
	}

	const edges = buildNonIntersectingEdgesGeneric(
		nodes,
		{
			maxDegree: p.maxDegree,
			maxNeighbors: p.maxNeighbors,
			maxEdgeLength: p.maxEdgeLength,
			preferConnected: p.preferConnected,
		},
		geom
	);

	runtime.nodes = nodes.map((n) => ({ id: n.id, x: n.point.x, y: n.point.y }));
	runtime.edges = edges;

	renderStats({ demo: DEMO, seed, at: new Date().toLocaleTimeString(), nodes: nodes.length, edges: edges.length, maxDegree: p.maxDegree });
	setOutputText(
		JSON.stringify(
			{
				demo: DEMO,
				seed,
				nodes: nodes.length,
				edges: edges.length,
				firstEdges: edges.slice(0, 10),
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

	// p5 instance mode
	sketchP5 = new window.p5((p) => {
		p.setup = () => {
			p.createCanvas(defaultParams.graph.width, defaultParams.graph.height).parent(els.canvasMount);
			p.pixelDensity(1);
			p.noLoop();
			rebuildParamUI();
			regen();
		};

		p.draw = () => {
			p.background(18);

			// edges
			const map = new Map(runtime.nodes.map((n) => [n.id, n]));
			p.push();
			p.stroke("rgba(200,200,200,0.32)");
			p.strokeWeight(1);
			for (const e of runtime.edges) {
				const a = map.get(e.from);
				const b = map.get(e.to);
				if (!a || !b) continue;
				p.line(a.x, a.y, b.x, b.y);
			}
			p.pop();

			p.push();
			p.stroke("rgba(20,20,20,0.8)");
			p.fill("rgba(240,240,240,0.95)");
			for (const n of runtime.nodes) p.circle(n.x, n.y, 10);
			p.pop();
		};
	}, els.canvasMount);

	setStatus("ready");
}

boot();

