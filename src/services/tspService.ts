import { NetworkData, RouteResult, PopulationMember } from "../types";

type Graph = Record<string, Record<string, number>>;


export class TSPService {
  // 1) Fuerza bruta 
  // con poda (branch-and-bound) y ruta según malla
  static bruteForce(network: NetworkData, pointIds: string[]): RouteResult {
  const t0 = Date.now();
  const timeLimitMs = 30_000;
  console.log(`BruteForce: iniciando con ${pointIds.length} puntos`);

  // Construir grafo y matriz de distancias
  const graph   = this.buildGraph(network);
  const distMap = this.computeDistanceMatrix(graph, pointIds);

  const n = pointIds.length;
  let bestSeq: string[] = [];
  let bestDist = Infinity;
  let stopped = false;

  // Contadores
  let totalCalls = 0;
  let skipVisited = 0;

  function dfs(curr: string, visited: Set<string>, seq: string[], dSoFar: number) {
    // Comprobación síncrona de timeout
    if (Date.now() - t0 >= timeLimitMs) {
      stopped = true;
      return;
    }
    totalCalls++;

    if (dSoFar >= bestDist) return;              // poda por cota superior
    if (seq.length === n) {
      bestDist = dSoFar;
      bestSeq  = [...seq];
      console.log(`▶ Mejor hasta ahora: dist=${bestDist}, seq=[${bestSeq.join('→')}]`);
      return;
    }
    for (const nxt of pointIds) {
      if (stopped) return;
      if (visited.has(nxt)) {
        skipVisited++;
        continue;
      }
      const d = distMap[curr][nxt];
      if (d === Infinity) continue;
      visited.add(nxt);
      seq.push(nxt);
      dfs(nxt, visited, seq, dSoFar + d);
      seq.pop();
      visited.delete(nxt);
    }
  }

  // Arrancar DFS desde cada punto
  for (const start of pointIds) {
    if (stopped) break;
    console.log(`DFS desde ${start}`);
    dfs(start, new Set([start]), [start], 0);
  }

  console.log(`BruteForce: detenido tras ${Date.now() - t0} ms`);
  console.log(`  totalCalls:  ${totalCalls}`);
  console.log(`  skipVisited: ${skipVisited}`);
  console.log(`  mejorDist:   ${bestDist}`);

  // Reconstruir ruta completa sobre la malla
  const fullPath = this.buildFullPath(graph, bestSeq);

  return {
    path:       fullPath,
    distance:   bestDist,
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
    config = { populationSize: 50, generations: 100, mutationRate: 0.02, eliteSize: 5, tournamentSize: 3, earlyStop: 20 }
  ): RouteResult {
    const t0 = Date.now();
    const graph = this.buildGraph(network);
    const distMap = this.computeDistanceMatrix(graph, pointIds);

    function routeDistance(route: string[]): number {
      let sum = 0;
      for (let i = 0; i < route.length - 1; i++) {
        sum += distMap[route[i]][route[i + 1]];
      }
      return sum;
    }

    // Order Crossover (OX)
    function orderCrossover(parent1: string[], parent2: string[]): string[] {
      const n = parent1.length;
      const [a, b] = [Math.floor(Math.random() * n), Math.floor(Math.random() * n)].sort((x, y) => x - y);
      const child = Array(n).fill(null) as (string | null)[];
      for (let i = a; i <= b; i++) child[i] = parent1[i];
      let p2idx = 0;
      for (let i = 0; i < n; i++) {
        if (child[i] !== null) continue;
        while (child.includes(parent2[p2idx])) p2idx++;
        child[i] = parent2[p2idx];
        p2idx++;
      }
      return child as string[];
    }

    // 2-opt mutation
    function twoOpt(route: string[]): string[] {
      const n = route.length;
      if (n < 4) return route.slice();
      let i = Math.floor(Math.random() * (n - 2));
      let j = i + 2 + Math.floor(Math.random() * (n - i - 2));
      return route.slice(0, i).concat(route.slice(i, j).reverse(), route.slice(j));
    }

    // Torneo
    function tournament(pop: { path: string[]; distance: number }[], k: number): string[] {
      let best = pop[Math.floor(Math.random() * pop.length)];
      for (let i = 1; i < k; i++) {
        const challenger = pop[Math.floor(Math.random() * pop.length)];
        if (challenger.distance < best.distance) best = challenger;
      }
      return best.path;
    }

    // 2-opt local para mejorar rutas
    function twoOptLocal(route: string[]): string[] {
      let improved = true;
      let best = route.slice();
      let bestDist = routeDistance(best);
      while (improved) {
        improved = false;
        for (let i = 1; i < best.length - 2; i++) {
          for (let j = i + 1; j < best.length - 1; j++) {
            const newRoute = best.slice(0, i).concat(best.slice(i, j + 1).reverse(), best.slice(j + 1));
            const newDist = routeDistance(newRoute);
            if (newDist < bestDist) {
              best = newRoute;
              bestDist = newDist;
              improved = true;
            }
          }
        }
      }
      return best;
    }

    // Inicialización
    let pop = Array.from({ length: config.populationSize }, () => {
      const p = [...pointIds];
      for (let i = p.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
      }
      return p;
    });

    let bestSeq = pop[0];
    let bestDist = routeDistance(bestSeq);
    let bestGen = 0;
    let lastBest = bestDist;

    for (let gen = 0; gen < config.generations; gen++) {
      // Evaluar y ordenar
      const evaluated = pop
        .map(path => ({ path, distance: routeDistance(path) }))
        .sort((a, b) => a.distance - b.distance);

      // Elitismo con mejora local (2-opt)
      const nextGen: string[][] = evaluated.slice(0, config.eliteSize).map(ind => twoOptLocal(ind.path));

      // Actualizar mejor
      if (routeDistance(nextGen[0]) < bestDist) {
        bestDist = routeDistance(nextGen[0]);
        bestSeq = nextGen[0];
        bestGen = gen;
      }

      // Early stopping
      if (gen - bestGen > config.earlyStop) break;

      // Diversidad: si la población converge, reinyecta aleatorios
      if (evaluated[0].distance === evaluated[evaluated.length - 1].distance) {
        for (let i = 0; i < config.eliteSize; i++) {
          const p = [...pointIds];
          for (let j = p.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [p[j], p[k]] = [p[k], p[j]];
          }
          nextGen.push(p);
        }
      }

      // Reproducir hasta llenar la población
      while (nextGen.length < config.populationSize) {
        const parent1 = tournament(evaluated, config.tournamentSize);
        const parent2 = tournament(evaluated, config.tournamentSize);
        let child = orderCrossover(parent1, parent2);
        if (Math.random() < config.mutationRate) {
          child = twoOpt(child);
        }
        nextGen.push(child);
      }
      pop = nextGen;
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
