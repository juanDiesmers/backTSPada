import { Node, Edge } from '../utils/osmParser';

let meshNodes: Node[] = [];
let meshEdges: Edge[] = [];

// Guardar la malla recien parseada
export function setMesh(nodes: Node[], edges: Edge[]): void {
  meshNodes = nodes;
  meshEdges = edges;
}

// Devolver los nodos de la malla
export function getMeshNodes(): Node[] {
  return meshNodes;
}

// Devolver las aristas
export function getMeshEdges(): Edge[] {
  return meshEdges;
}