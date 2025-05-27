import { NetworkData, RouteResult, PopulationMember } from "../types";

type Graph = Record<string, Record<string, number>>;


export class TSPService {
  // 1) Fuerza bruta 
  // con poda (branch-and-bound) y ruta según malla
  static bruteForce(network: NetworkData, pointIds: string[]): RouteResult {
    const t0 = Date.now();
    const graph = this.buildGraph(network);
    const distMap = this.computeDistanceMatrix(graph, pointIds);

    const n = pointIds.length;
    let bestSeq: string[] = [];
    let bestDist = Infinity;

    // DFS recursivo con poda
    function dfs(curr: string, visited: Set<string>, seq: string[], dSoFar: number) {
      if (dSoFar >= bestDist) return;
      if (seq.length === n) {
        bestDist = dSoFar;
        bestSeq = [...seq];
        return;
      }
      for (const nxt of pointIds) {
        if (!visited.has(nxt)) {
          const d = distMap[curr][nxt];
          if (d === Infinity) continue;
          visited.add(nxt);
          seq.push(nxt);
          dfs(nxt, visited, seq, dSoFar + d);
          seq.pop();
          visited.delete(nxt);
        }
      }
    }

    // iniciar DFS desde cada punto
    for (const start of pointIds) {
      dfs(start, new Set([start]), [start], 0);
    }

    // reconstruir ruta completa sobre la malla
    const fullPath = this.buildFullPath(graph, bestSeq);

    return {
      path: fullPath,
      distance: bestDist,
      durationMs: Date.now() - t0
    };
  }

  // 2) Vecino más cercano
  static nearestNeighbor(network: NetworkData, pointIds: string[]): RouteResult {
    const t0 = Date.now();
    const graph = this.buildGraph(network);
    const distMap = this.computeDistanceMatrix(graph, pointIds);

    const unvisited = new Set(pointIds.slice(1));
    const seq = [pointIds[0]];
    let total = 0;
    let curr = seq[0];

    while (unvisited.size) {
      let best: string | null = null;
      let bestD = Infinity;
      for (const pid of unvisited) {
        const d = distMap[curr][pid];
        if (d < bestD) {
          bestD = d;
          best = pid;
        }
      }
      if (!best) throw new Error("Ruta incompleta");
      total += bestD;
      seq.push(best);
      unvisited.delete(best);
      curr = best;
    }

    const fullPath = this.buildFullPath(graph, seq);

    return { path: fullPath, distance: total, durationMs: Date.now() - t0 };
  }

  // 3) Genético
   static geneticAlgorithm(
    network: NetworkData,
    pointIds: string[],
    config = { populationSize: 50, generations: 100, mutationRate: 0.02, eliteSize: 5 }
  ): RouteResult {
    const t0 = Date.now();
    const graph = this.buildGraph(network);
    const distMap = this.computeDistanceMatrix(graph, pointIds);

    // población inicial
    let pop = Array.from({ length: config.populationSize }, () => {
      const p = [...pointIds];
      for (let i = p.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
      }
      return p;
    });

    // función de fitness
    const evaluate = (population: string[][]) =>
      population
        .map(path => ({
          path,
          distance: path.slice(0, -1).reduce((sum, cur, i) => sum + distMap[cur][path[i + 1]], 0)
        }))
        .sort((a, b) => a.distance - b.distance);

    let evaluated = evaluate(pop);
    let bestSeq = evaluated[0].path;
    let bestDist = evaluated[0].distance;

    for (let gen = 0; gen < config.generations; gen++) {
      const nextGen = evaluated.slice(0, config.eliteSize).map(ind => ind.path);

      while (nextGen.length < config.populationSize) {
        const a = evaluated[Math.floor(Math.random() * config.eliteSize)].path;
        const b = evaluated[Math.floor(Math.random() * config.eliteSize)].path;
        const cut1 = Math.floor(Math.random() * pointIds.length);
        const cut2 = cut1 + Math.floor(Math.random() * (pointIds.length - cut1));
        const segment = a.slice(cut1, cut2);
        const rest = b.filter(id => !segment.includes(id));
        const child = [...rest.slice(0, cut1), ...segment, ...rest.slice(cut1)];

        if (Math.random() < config.mutationRate) {
          const i = Math.floor(Math.random() * child.length);
          const j = Math.floor(Math.random() * child.length);
          [child[i], child[j]] = [child[j], child[i]];
        }
        nextGen.push(child);
      }

      evaluated = evaluate(nextGen);
      if (evaluated[0].distance < bestDist) {
        bestDist = evaluated[0].distance;
        bestSeq = evaluated[0].path;
      }
    }

    const fullPath = this.buildFullPath(graph, bestSeq);

    return { path: fullPath, distance: bestDist, durationMs: Date.now() - t0 };
  }

  // --- Auxiliares ---
  private static buildGraph(network: NetworkData): Graph {
    const g: Graph = {};
    for (const n of network.nodes) {
      g[n.id] = {};
    }
    for (const e of network.edges) {
      g[e.from][e.to] = e.distance;
      g[e.to][e.from] = e.distance;
    }
    return g;
  }

  /** Matriz de distancias punto a punto (lookup O(1)) */
  private static computeDistanceMatrix(
    graph: Graph,
    points: string[]
  ): Record<string, Record<string, number>> {
    const m: Record<string, Record<string, number>> = {};
    for (const p of points) {
      m[p] = this.dijkstraDistances(graph, p);
    }
    return m;
  }

  /** Dijkstra que devuelve solo distancias */
  private static dijkstraDistances(
    graph: Graph,
    start: string
  ): Record<string, number> {
    const dist: Record<string, number> = {};
    const visited = new Set<string>();
    Object.keys(graph).forEach(k => (dist[k] = Infinity));
    dist[start] = 0;

    const heap = new MinHeap<string>();
    heap.push(start, 0);

    while (!heap.isEmpty()) {
      const { key: u, value: d } = heap.pop()!;
      if (visited.has(u)) continue;
      visited.add(u);
      for (const [v, w] of Object.entries(graph[u])) {
        if (!visited.has(v) && d + w < dist[v]) {
          dist[v] = d + w;
          heap.push(v, dist[v]);
        }
      }
    }
    return dist;
  }

  /** Reconstruye la ruta completa concatenando los segmentos */
  private static buildFullPath(graph: Graph, seq: string[]): string[] {
    const full: string[] = [];
    for (let i = 0; i < seq.length - 1; i++) {
      const { path: segment } = this.findShortestPath(graph, seq[i], seq[i + 1]);
      if (i === 0) full.push(...segment);
      else full.push(...segment.slice(1));
    }
    return full;
  }

  /** Dijkstra con prev para obtener la ruta entre dos nodos */
  private static findShortestPath(
    graph: Graph,
    start: string,
    end: string
  ): { path: string[]; distance: number } {
    const dist: Record<string, number> = {};
    const prev: Record<string, string | null> = {};
    const visited = new Set<string>();
    Object.keys(graph).forEach(k => {
      dist[k] = Infinity;
      prev[k] = null;
    });
    dist[start] = 0;

    const heap = new MinHeap<string>();
    heap.push(start, 0);

    while (!heap.isEmpty()) {
      const { key: u, value: d } = heap.pop()!;
      if (u === end) break;
      if (visited.has(u)) continue;
      visited.add(u);

      for (const [v, w] of Object.entries(graph[u])) {
        if (visited.has(v)) continue;
        const alt = d + w;
        if (alt < dist[v]) {
          dist[v] = alt;
          prev[v] = u;
          heap.push(v, alt);
        }
      }
    }

    // reconstruir camino
    const path: string[] = [];
    let cur: string | null = end;
    if (prev[cur] === null && cur !== start) {
      return { path: [], distance: Infinity };
    }
    while (cur) {
      path.push(cur);
      cur = prev[cur];
    }
    path.reverse();
    return { path, distance: dist[end] };
  }
}

/** Min-heap simple para Dijkstra */
class MinHeap<K> {
  private heap: { key: K; value: number }[] = [];

  isEmpty() {
    return this.heap.length === 0;
  }

  push(key: K, value: number) {
    this.heap.push({ key, value });
    this.heapifyUp(this.heap.length - 1);
  }

  pop(): { key: K; value: number } | undefined {
    if (!this.heap.length) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length) {
      this.heap[0] = last;
      this.heapifyDown(0);
    }
    return top;
  }

  private heapifyUp(i: number) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.heap[p].value <= this.heap[i].value) break;
      [this.heap[p], this.heap[i]] = [this.heap[i], this.heap[p]];
      i = p;
    }
  }

  private heapifyDown(i: number) {
    const n = this.heap.length;
    while (true) {
      let left = 2 * i + 1,
          right = 2 * i + 2,
          smallest = i;
      if (left < n && this.heap[left].value < this.heap[smallest].value) {
        smallest = left;
      }
      if (right < n && this.heap[right].value < this.heap[smallest].value) {
        smallest = right;
      }
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
}
