import { NetworkData, NetworkEdge, Point, RouteResult, PopulationMember} from "../types";

export class TSPService {

  // Metodo de fuerza bruta(para pequeños conjuntos de datos)
  static bruteForce(network: NetworkData, points: Point[]): RouteResult {
    const startTime = Date.now();
  
    if (points.length > 10) {
      throw new Error("El algoritmo de fuerza bruta no debe usarse con más de 10 puntos");
    }
  
    const pointIds = points.map(point => point.id);
    const permutations = this.generatePermutations(pointIds);
    let shortestPath: string[] = [];
    let minDistance = Infinity;
  
    for (const permutation of permutations) {
      let currentDistance = 0;
      let isValid = true;
  
      for (let i = 0; i < permutation.length - 1; i++) {
        try {
          const graph = this.buildGraph(network);
          currentDistance += this.findShortestPathDistance(graph, permutation[i], permutation[i+1]);
        } catch {
          isValid = false;
          break;
        }
      }
  
      if (isValid && currentDistance < minDistance) {
        minDistance = currentDistance;
        shortestPath = permutation;
      }
    }
  
    return {
      path: shortestPath,
      distance: minDistance,
      durationMs: Date.now() - startTime
    };
  }

  // Algoritmo del Vecino mas cercano
  static nearestNeighbor(network: NetworkData, points: Point[]): RouteResult {
    const startTime = Date.now();
    this.validatePoints(network, points);
    const graph = this.buildGraph(network);

    let currentPoint = points[0].id;
    const path: string[] = [currentPoint];
    let totalDistance = 0;
    const unvisited = new Set(points.slice(1).map(p => p.id));

    while (unvisited.size > 0) {
      let nearest: string | null = null;
      let minDistance = Infinity;

      unvisited.forEach(pointId => {
        const distance = this.findShortestPathDistance(graph, currentPoint, pointId);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = pointId;
        }
      });

      if (!nearest) throw new Error("No se encontro ruta valida");

      path.push(nearest);
      totalDistance += minDistance;
      unvisited.delete(nearest);
      currentPoint = nearest;
    }

    return {
      path,
      distance: totalDistance,
      durationMs: Date.now() - startTime
    };
  }

  // Algoritmo Genetico
  static geneticAlgorithm(network: NetworkData, points: Point[], config = {
    populationSize: 50,
        generations: 100,
        mutationRate: 0.02,
        eliteSize: 5,
        earlyStoppongRound: 5
  }): RouteResult {
    const startTime = Date.now();
    this.validatePoints(network, points);
    const graph = this.buildGraph(network);
    const pointIds = points.map(p => p.id);

    // 1. Inicialización
    let population = this.initializePopulation(pointIds, config.populationSize);
    
    // 2. Evaluación inicial
    population = this.evaluatePopulation(population, graph);
    let bestSolution = population[0];

    // 3. Evolución
    for (let gen = 0; gen < config.generations; gen++) {
      // Selección
      const parents = this.tournamentSelection(population, config.populationSize / 2);
      
      // Cruce
      const offspring = this.orderedCrossover(parents);
      
      // Mutación
      this.mutatePopulation(offspring, config.mutationRate);
      
      // Evaluación
      const evaluatedOffspring = this.evaluatePopulation(offspring, graph);
      
      // Reemplazo (estrategia elitista)
      population = [...population.slice(0, config.eliteSize), ...evaluatedOffspring]
        .sort((a, b) => a.distance - b.distance)
        .slice(0, config.populationSize);
      
      // Actualizar mejor solución
      if (population[0].distance < bestSolution.distance) {
        bestSolution = population[0];
      }
    }

    return {
      path: bestSolution.path,
      distance: bestSolution.distance,
      durationMs: Date.now() - startTime
    };
  }

  // Metodos Auxiliares

  private static validatePoints(network: NetworkData, points: Point[]) {
    const nodeIds = new Set(network.nodes.map(n => n.id));
    const invalidPoints = points.filter(p => !nodeIds.has(p.id));

    if (invalidPoints.length > 0) {
      throw new Error(`Puntos no encontrados en la red: ${invalidPoints.map(p => p.id).join(', ')}`);
    }
  }

  private static buildGraph(network: NetworkData): Record<string, Record<string, number>> {
    const graph: Record<string, Record<string, number>> = {};
    
    network.nodes.forEach(node => {
      graph[node.id] = {};
    });

    network.edges.forEach(edge => {
      graph[edge.from][edge.to] = edge.distance || 0;
      graph[edge.to][edge.from] = edge.distance || 0;
    });

    return graph;
  }

  private static findShortestPathDistance(graph: Record<string, Record<string, number>>, start: string, end: string): number {
    const distances: Record<string, number> = {};
    const visited = new Set<string>();
    
    Object.keys(graph).forEach(node => {
      distances[node] = node === start ? 0 : Infinity;
    });

    let currentNode  = start;

    while (currentNode !== end) {
      visited.add(currentNode);

      Object.entries(graph[currentNode]).forEach(([neighbor, distance]) => {
        if (!visited.has(neighbor)) {
          const newDistance = distances[currentNode] + distance;
          if (newDistance < distances[neighbor]) {
            distances[neighbor] = newDistance;
          }
        }
      });

      let nextNode: string | null = null;
      let minDistance = Infinity;

      Object.entries(distances).forEach(([node, distance]) => {
        if (!visited.has(node) && distance < minDistance) {
          minDistance = distance;
          nextNode = node;
        }
      });

      if (!nextNode) throw new Error("No existe ruta entre los puntos");
      currentNode = nextNode;
    }

    return distances[end];
  }


  private static generatePermutations(arr: string[]): string[][] {
    if (arr.length <= 1) return [arr];
    
    const results: string[][] = [];

    for (let i = 0; i < arr.length; i++) {
      const current = arr[i];
      const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
      const remainingPerms = this.generatePermutations(remaining);

      for (const perm of remainingPerms) {
        results.push([current, ...perm]);
      }
    }

    return results;
  }

  private static findConnectingEdge(network: NetworkData, from: string, to: string): NetworkEdge | undefined {
    return network.edges.find(e =>
    (e.from === from && e.to === to) ||
    (e.from === to && e.to === from)
    );
  }

  // Metodos algoritmos geneticos
  
  private static initializePopulation(pointIds: string[], size: number): PopulationMember[] {
    const population: PopulationMember[] = [];
    const basePath = [...pointIds];
    
    for (let i = 0; i < size; i++) {
      const shuffled = [...basePath];
      for (let j = shuffled.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
      }
      population.push({ path: shuffled, distance: Infinity });
    }
    
    return population;
  }

  private static evaluatePopulation(population: PopulationMember[], graph: Record<string, Record<string, number>>): PopulationMember[] {
    return population.map(individual => {
      let totalDistance = 0;
      let isValid = true;
      
      for (let i = 0; i < individual.path.length - 1; i++) {
        try {
          totalDistance += this.findShortestPathDistance(graph, individual.path[i], individual.path[i+1]);
        } catch {
          isValid = false;
          break;
        }
      }
      
      return {
        path: individual.path,
        distance: isValid ? totalDistance : Infinity
      };
    }).sort((a, b) => a.distance - b.distance);
  }

  private static tournamentSelection(population: PopulationMember[], size: number): PopulationMember[] {
    const selected: PopulationMember[] = [];
    
    while (selected.length < size) {
      const candidates = [...population]
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);
      
      selected.push(candidates.reduce((best, current) => 
        current.distance < best.distance ? current : best
      ));
    }
    
    return selected;
  }

  private static orderedCrossover(parents: PopulationMember[]): PopulationMember[] {
    const offspring: PopulationMember[] = [];
    
    for (let i = 0; i < parents.length; i += 2) {
      if (i + 1 >= parents.length) break;
      
      const parent1 = parents[i].path;
      const parent2 = parents[i+1].path;
      const length = parent1.length;
      
      // Seleccionar segmento aleatorio
      const start = Math.floor(Math.random() * length);
      const end = Math.floor(Math.random() * (length - start)) + start;
      
      // Crear descendencia
      const child1 = this.createOffspring(parent1, parent2, start, end);
      const child2 = this.createOffspring(parent2, parent1, start, end);
      
      offspring.push(
        { path: child1, distance: Infinity },
        { path: child2, distance: Infinity }
      );
    }
    
    return offspring;
  }

  private static createOffspring(parentA: string[], parentB: string[], start: number, end: number): string[] {
    const segment = parentA.slice(start, end + 1);
    const remaining = parentB.filter(gene => !segment.includes(gene));
    
    return [
      ...remaining.slice(0, start),
      ...segment,
      ...remaining.slice(start)
    ];
  }

  private static mutatePopulation(population: PopulationMember[], rate: number): void {
    population.forEach(individual => {
      if (Math.random() < rate) {
        const i = Math.floor(Math.random() * individual.path.length);
        const j = Math.floor(Math.random() * individual.path.length);
        [individual.path[i], individual.path[j]] = [individual.path[j], individual.path[i]];
      }
    });
  }
}