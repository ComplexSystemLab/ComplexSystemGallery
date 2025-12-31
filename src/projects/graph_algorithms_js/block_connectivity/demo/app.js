/**
 * block_connectivity 可视化 Demo（同属性连通块）。
 *
 * 说明：
 * - 本页面为纯 HTML/JS，依赖 p5.js（CDN）
 * - 算法实现由同目录的 `algorithms.bundle.js` 提供，并挂载在 `window.GA`
 */

/** @type {"block"} */
const DEMO = "block";

/**
 * 从 `window.GA` 读取算法函数。
 *
 * @type {{
 *   getGraphologyBlockMembers?: Function,
 * }}
 */
const GA = (window.GA || {});

/** @type {(graph: any, startNodeId: string, attrName: string) => string[]} */
const getGraphologyBlockMembers = GA.getGraphologyBlockMembers;

if (!getGraphologyBlockMembers) {
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
 * 读取当前 Seed。
 *
 * @returns {number}
 */
function getSeed() {
	const n = Number(els.seedInput?.value);
	return Number.isFinite(n) ? n : 42;
}

/**
 * 默认参数（只保留 block demo 相关参数）。
 */
const defaultParams = {
	block: { width: 900, height: 650, n: 120, linkRadius: 85, colorCount: 4 },
};

/** @type {{block: typeof defaultParams.block}} */
let params = JSON.parse(JSON.stringify(defaultParams));

/** @type {any} */
let sketchP5 = null;

/**
 * 调色板。
 */
const palette = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6", "#1abc9c"];

/**
 * 运行时数据（节点/边 + 选中信息）。
 */
const runtime = {
	demo: DEMO,
	/** @type {{id:string,x:number,y:number,color:string}[]} */
	nodes: [],
	/** @type {{from:string,to:string}[]} */
	edges: [],
	block: {
		/** @type {any} */
		graph: null,
		/** @type {Set<string>} */
		selectedBlock: new Set(),
		/** @type {string|null} */
		selectedNodeId: null,
	},
};

/**
 * 查找点击位置附近的最近节点。
 *
 * @param {{id:string,x:number,y:number}[]} nodes
 * @param {number} x
 * @param {number} y
 * @param {number} maxDist
 * @returns {{id:string,x:number,y:number}|null}
 */
function findNearestNode(nodes, x, y, maxDist) {
	let best = null;
	let bestD2 = maxDist * maxDist;
	for (const n of nodes) {
		const dx = n.x - x;
		const dy = n.y - y;
		const d2 = dx * dx + dy * dy;
		if (d2 <= bestD2) {
			bestD2 = d2;
			best = n;
		}
	}
	return best;
}

/**
 * 重新渲染参数输入区。
 */
function rebuildParamUI() {
	if (!els.paramArea) return;
	els.paramArea.innerHTML = "";

	els.paramArea.appendChild(mkRow("Width", mkNumber({ value: params.block.width, min: 200, max: 1400, step: 10 }, (v) => (params.block.width = v))));
	els.paramArea.appendChild(mkRow("Height", mkNumber({ value: params.block.height, min: 200, max: 1000, step: 10 }, (v) => (params.block.height = v))));
	els.paramArea.appendChild(mkRow("Node count", mkNumber({ value: params.block.n, min: 10, max: 700, step: 1 }, (v) => (params.block.n = v))));
	els.paramArea.appendChild(mkRow("Link radius", mkNumber({ value: params.block.linkRadius, min: 10, max: 260, step: 5 }, (v) => (params.block.linkRadius = v))));
	els.paramArea.appendChild(mkRow("Color count", mkNumber({ value: params.block.colorCount, min: 2, max: 8, step: 1 }, (v) => (params.block.colorCount = v))));
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
	const p = params.block;

	const nodes = [];
	for (let i = 0; i < p.n; i++) {
		const x = rng() * p.width;
		const y = rng() * p.height;
		const colorIdx = Math.floor(rng() * p.colorCount);
		const color = palette[colorIdx % palette.length];
		nodes.push({ id: `b${i}`, x, y, color });
	}

	const edges = [];
	const r2 = p.linkRadius * p.linkRadius;
	for (let i = 0; i < nodes.length; i++) {
		for (let j = i + 1; j < nodes.length; j++) {
			const dx = nodes[i].x - nodes[j].x;
			const dy = nodes[i].y - nodes[j].y;
			if (dx * dx + dy * dy <= r2) {
				edges.push({ from: nodes[i].id, to: nodes[j].id });
			}
		}
	}

	// 最小 duck-typed Graphology 适配器：供 getGraphologyBlockMembers 使用
	const adj = new Map();
	const attrs = new Map();
	for (const n of nodes) attrs.set(n.id, { color: n.color });
	for (const n of nodes) adj.set(n.id, []);
	for (const e of edges) {
		adj.get(e.from).push(e.to);
		adj.get(e.to).push(e.from);
	}
	const graphAdapter = {
		getNodeAttribute: (id, name) => attrs.get(id)?.[name],
		neighbors: (id) => adj.get(id) || [],
	};

	runtime.nodes = nodes;
	runtime.edges = edges;
	runtime.block.graph = graphAdapter;
	runtime.block.selectedBlock = new Set();
	runtime.block.selectedNodeId = null;

	renderStats({ demo: DEMO, seed, at: new Date().toLocaleTimeString(), nodes: nodes.length, edges: edges.length, linkRadius: p.linkRadius, colorCount: p.colorCount });
	setOutputText(
		JSON.stringify(
			{
				demo: DEMO,
				seed,
				nodes: nodes.length,
				edges: edges.length,
				note: "点击节点后，会计算同色连通块并高亮",
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
			p.createCanvas(defaultParams.block.width, defaultParams.block.height).parent(els.canvasMount);
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
			p.stroke("rgba(200,200,200,0.18)");
			p.strokeWeight(1);
			for (const e of runtime.edges) {
				const a = map.get(e.from);
				const b = map.get(e.to);
				if (!a || !b) continue;
				p.line(a.x, a.y, b.x, b.y);
			}
			p.pop();

			// nodes
			const selected = runtime.block.selectedBlock;
			p.push();
			p.stroke("rgba(0,0,0,0.55)");
			p.strokeWeight(1);
			for (const n of runtime.nodes) {
				let fill = n.color;
				if (selected.size > 0 && !selected.has(n.id)) fill = "rgba(120,120,120,0.20)";
				p.fill(fill);
				p.circle(n.x, n.y, 10);
			}
			p.pop();

			if (runtime.block.selectedNodeId) {
				const n = map.get(runtime.block.selectedNodeId);
				if (n) {
					p.push();
					p.noFill();
					p.stroke("rgba(255,255,255,0.9)");
					p.strokeWeight(2);
					p.circle(n.x, n.y, 18);
					p.pop();
				}
			}
		};

		p.mousePressed = () => {
			const picked = findNearestNode(runtime.nodes, p.mouseX, p.mouseY, 14);
			if (!picked) return;

			runtime.block.selectedNodeId = picked.id;
			const members = getGraphologyBlockMembers(runtime.block.graph, picked.id, "color");
			runtime.block.selectedBlock = new Set(members);

			renderStats({
				demo: DEMO,
				seed: getSeed(),
				at: new Date().toLocaleTimeString(),
				selected: picked.id,
				blockSize: runtime.block.selectedBlock.size,
			});

			setOutputText(
				JSON.stringify(
					{
						demo: DEMO,
						selected: picked.id,
						blockMembers: members,
					},
					null,
					2
				)
			);
			p.redraw();
		};
	}, els.canvasMount);

	setStatus("ready");
}

boot();

