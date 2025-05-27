// backend/src/services/meshService.ts
import { Node, Edge } from '../types/index';

let meshNodes: Node[] = [];
let meshEdges: Edge[] = [];

export function setMesh(nodes: Node[], edges: Edge[]): void {
  meshNodes = nodes;
  meshEdges = edges;
}

export function getMeshNodes(): Node[] {
  return meshNodes;
}

export function getMeshEdges(): Edge[] {
  return meshEdges;
}
