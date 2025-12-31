/*
 * algorithms.bundle.js
 *
 * A tiny browser bundle (no ESM, no require) for running in file:// previews.
 * Exposes a minimal API on window.GA used by viz/app.js:
 *   - generatePoissonDiskPoints
 *   - buildNonIntersectingEdgesGeneric
 *   - getGraphologyBlockMembers (duck-typed)
 */

(function () {
  'use strict';

  /** @typedef {{x:number, y:number}} Point */

  // -------------------------
  // Poisson disk sampling
  // -------------------------

  /**
   * @param {Object} options
   * @returns {Point[]}
   */
  function generatePoissonDiskPoints(options) {
    const {
      width,
      height,
      radius,
      k = 30,
      boundaryType = 'rect',
      centerX = width / 2,
      centerY = height / 2,
      circleRadius = Math.min(width, height) / 2,
      maxPoints,
      rng = Math.random
    } = options;

    const state = initPoissonState(width, height, radius);
    const first = sampleFirstPoint({ width, height, boundaryType, centerX, centerY, circleRadius, rng });
    addPointToState(state, first);

    while (state.activeList.length > 0) {
      if (maxPoints != null && state.points.length >= maxPoints) break;

      const idx = Math.floor(rng() * state.activeList.length);
      const baseIndex = state.activeList[idx];
      const basePoint = state.points[baseIndex];

      let found = false;
      for (let attempt = 0; attempt < k; attempt++) {
        const q = generateRandomPointAround(basePoint, radius, rng);
        if (!isInsideBoundary(q, { width, height, boundaryType, centerX, centerY, circleRadius })) continue;
        if (!isFarEnoughFromNeighbors(q, state, radius)) continue;
        addPointToState(state, q);
        found = true;
        break;
      }

      if (!found) {
        state.activeList.splice(idx, 1);
      }
    }

    return state.points;
  }

  function initPoissonState(width, height, radius) {
    const cellSize = radius / Math.SQRT2;
    const gridWidth = Math.ceil(width / cellSize);
    const gridHeight = Math.ceil(height / cellSize);
    const grid = new Array(gridWidth * gridHeight).fill(null);

    return {
      cellSize,
      gridWidth,
      gridHeight,
      grid,
      points: [],
      activeList: []
    };
  }

  function sampleFirstPoint(ctx) {
    const { width, height, boundaryType, centerX, centerY, circleRadius, rng } = ctx;

    if (boundaryType === 'rect') {
      return { x: rng() * width, y: rng() * height };
    }

    const theta = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * circleRadius;
    return {
      x: centerX + r * Math.cos(theta),
      y: centerY + r * Math.sin(theta)
    };
  }

  function addPointToState(state, p) {
    const index = state.points.length;
    state.points.push(p);
    state.activeList.push(index);

    const gridIndex = pointToGridIndex(p, state);
    if (gridIndex != null) {
      state.grid[gridIndex] = p;
    }
  }

  function generateRandomPointAround(base, radius, rng) {
    const r = radius * (1 + rng());
    const theta = rng() * Math.PI * 2;
    return {
      x: base.x + r * Math.cos(theta),
      y: base.y + r * Math.sin(theta)
    };
  }

  function isInsideBoundary(p, ctx) {
    const { width, height, boundaryType, centerX, centerY, circleRadius } = ctx;
    if (boundaryType === 'rect') {
      return p.x >= 0 && p.x < width && p.y >= 0 && p.y < height;
    }
    const dx = p.x - centerX;
    const dy = p.y - centerY;
    return dx * dx + dy * dy <= circleRadius * circleRadius;
  }

  function pointToGridIndex(p, state) {
    const gx = Math.floor(p.x / state.cellSize);
    const gy = Math.floor(p.y / state.cellSize);
    if (gx < 0 || gy < 0 || gx >= state.gridWidth || gy >= state.gridHeight) {
      return null;
    }
    return gy * state.gridWidth + gx;
  }

  function isFarEnoughFromNeighbors(p, state, radius) {
    const gx = Math.floor(p.x / state.cellSize);
    const gy = Math.floor(p.y / state.cellSize);
    if (gx < 0 || gy < 0 || gx >= state.gridWidth || gy >= state.gridHeight) {
      return false;
    }

    const radius2 = radius * radius;
    const searchRadius = 2;

    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        const nx = gx + dx;
        const ny = gy + dy;
        if (nx < 0 || ny < 0 || nx >= state.gridWidth || ny >= state.gridHeight) continue;
        const idx = ny * state.gridWidth + nx;
        const q = state.grid[idx];
        if (!q) continue;
        const d2 = (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y);
        if (d2 < radius2) return false;
      }
    }

    return true;
  }

  // -------------------------
  // Graph connectivity (no intersections)
  // -------------------------

  function buildNonIntersectingEdgesGeneric(nodes, opts, geom) {
    if (!nodes || nodes.length <= 1) return [];

    const candidates = collectCandidateEdgesGeneric(nodes, opts, geom.distance2);
    candidates.sort((a, b) => a.length2 - b.length2);

    const edges = [];
    const degrees = new Array(nodes.length).fill(0);

    const idToIndex = new Map();
    nodes.forEach((n, i) => idToIndex.set(n.id, i));

    for (const cand of candidates) {
      const uIdx = cand.fromIndex;
      const vIdx = cand.toIndex;

      if (degrees[uIdx] >= opts.maxDegree || degrees[vIdx] >= opts.maxDegree) continue;

      const A = nodes[uIdx].point;
      const B = nodes[vIdx].point;

      let intersects = false;
      for (const e of edges) {
        const ei = idToIndex.get(e.from);
        const ej = idToIndex.get(e.to);

        if (ei === uIdx || ei === vIdx || ej === uIdx || ej === vIdx) continue;

        const C = nodes[ei].point;
        const D = nodes[ej].point;
        if (geom.segmentsIntersect(A, B, C, D)) {
          intersects = true;
          break;
        }
      }

      if (!intersects) {
        edges.push({ from: nodes[uIdx].id, to: nodes[vIdx].id });
        degrees[uIdx]++;
        degrees[vIdx]++;
      }
    }

    if (opts.preferConnected) {
      ensureConnectivityGeneric(nodes, edges, opts, degrees, geom);
    }

    return edges;
  }

  function collectCandidateEdgesGeneric(nodes, opts, distance2Fn) {
    const candidates = [];
    const maxLen2 = opts.maxEdgeLength * opts.maxEdgeLength;

    for (let i = 0; i < nodes.length; i++) {
      const p = nodes[i].point;
      const local = [];

      for (let j = 0; j < nodes.length; j++) {
        if (j === i) continue;
        const q = nodes[j].point;
        const d2 = distance2Fn(p, q);
        if (d2 === 0 || d2 > maxLen2) continue;
        local.push({ fromIndex: i, toIndex: j, length2: d2 });
      }

      local.sort((a, b) => a.length2 - b.length2);
      const limited = local.slice(0, opts.maxNeighbors);

      for (const e of limited) {
        if (e.fromIndex < e.toIndex) {
          candidates.push(e);
        }
      }
    }

    const seen = new Set();
    const unique = [];
    for (const c of candidates) {
      const key = `${c.fromIndex}-${c.toIndex}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(c);
    }

    return unique;
  }

  function ensureConnectivityGeneric(nodes, edges, opts, degrees, geom) {
    const idToIndex = new Map();
    nodes.forEach((n, i) => idToIndex.set(n.id, i));

    const adjacencyIndex = Array.from({ length: nodes.length }, () => []);
    for (const e of edges) {
      const u = idToIndex.get(e.from);
      const v = idToIndex.get(e.to);
      adjacencyIndex[u].push(v);
      adjacencyIndex[v].push(u);
    }

    const componentId = new Array(nodes.length).fill(-1);
    let compCount = 0;

    for (let i = 0; i < nodes.length; i++) {
      if (componentId[i] !== -1) continue;
      const queue = [i];
      componentId[i] = compCount;
      while (queue.length) {
        const u = queue.shift();
        for (const v of adjacencyIndex[u]) {
          if (componentId[v] === -1) {
            componentId[v] = compCount;
            queue.push(v);
          }
        }
      }
      compCount++;
    }

    if (compCount <= 1) return;

    const maxLen2 = opts.maxEdgeLength * opts.maxEdgeLength;

    let changed = true;
    while (changed) {
      changed = false;

      const idToIndex2 = new Map();
      nodes.forEach((n, i) => idToIndex2.set(n.id, i));

      for (let ca = 0; ca < compCount; ca++) {
        for (let cb = ca + 1; cb < compCount; cb++) {
          let bestU = -1;
          let bestV = -1;
          let bestD2 = Infinity;

          for (let i = 0; i < nodes.length; i++) {
            if (componentId[i] !== ca) continue;
            if (degrees[i] >= opts.maxDegree) continue;

            for (let j = 0; j < nodes.length; j++) {
              if (componentId[j] !== cb) continue;
              if (degrees[j] >= opts.maxDegree) continue;

              const d2 = geom.distance2(nodes[i].point, nodes[j].point);
              if (d2 > maxLen2 || d2 >= bestD2) continue;

              bestD2 = d2;
              bestU = i;
              bestV = j;
            }
          }

          if (bestU === -1 || bestV === -1) continue;

          const A = nodes[bestU].point;
          const B = nodes[bestV].point;

          let intersects = false;
          for (const e of edges) {
            const uIdx = idToIndex2.get(e.from);
            const vIdx = idToIndex2.get(e.to);

            if (uIdx === bestU || uIdx === bestV || vIdx === bestU || vIdx === bestV) continue;

            const C = nodes[uIdx].point;
            const D = nodes[vIdx].point;
            if (geom.segmentsIntersect(A, B, C, D)) {
              intersects = true;
              break;
            }
          }

          if (!intersects) {
            edges.push({ from: nodes[bestU].id, to: nodes[bestV].id });
            degrees[bestU]++;
            degrees[bestV]++;

            const fromId = componentId[bestV];
            const toId = componentId[bestU];
            for (let i = 0; i < componentId.length; i++) {
              if (componentId[i] === fromId) componentId[i] = toId;
            }

            changed = true;
          }
        }
      }

      const set = new Set(componentId);
      compCount = set.size;
      if (compCount <= 1) break;
    }
  }

  // -------------------------
  // Block connectivity (same attribute), duck-typed "graphology-like" graph
  // -------------------------

  function getGraphologyBlockMembers(graph, nodeId, attrName = 'color') {
    const attr = graph.getNodeAttribute(nodeId, attrName);
    const visited = new Set();
    const members = [];
    const queue = [nodeId];
    visited.add(nodeId);
    while (queue.length) {
      const nid = queue.pop();
      members.push(nid);
      const neighbors = graph.neighbors(nid) || [];
      for (const nb of neighbors) {
        if (!visited.has(nb) && graph.getNodeAttribute(nb, attrName) === attr) {
          visited.add(nb);
          queue.push(nb);
        }
      }
    }
    return members;
  }

  window.GA = {
    generatePoissonDiskPoints,
    buildNonIntersectingEdgesGeneric,
    getGraphologyBlockMembers
  };
})();

