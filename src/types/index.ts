export interface NetworkNode {
  id: string;
  lat: number;
  lng: number;
}

export interface PopulationMember {
  path: string[];
  distance: number;
}

export interface NetworkEdge {
  from: string;
  to: string;
  distance?: number;
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface Point {
  id: string;
  lat: number;
  lng: number;
}

export interface RouteResult {
  path: string[];
  distance: number;
  durationMs: number;
}

export interface PopulationMember {
  path: string[];
  distance: number;
}