/** Nodo de la malla vial con latitud/longitud */
export interface NetworkNode {
  id:  string;
  lat: number;
  lng: number;
}

/** Arista (conexión) entre dos nodos de la red */
export interface NetworkEdge {
  from:     string;
  to:       string;
  distance?: number;
}

/** Conjunto completo de la red vial */
export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

/** Punto genérico (por ejemplo para snapping) */
export interface Point {
  id:  string;
  lat: number;
  lng: number;
}

/** Miembro de la población en algoritmos genéticos */
export interface PopulationMember {
  path:     string[];
  distance: number;
}

/** Resultado de una ruta (TSP u otro) */
export interface RouteResult {
  path:       string[];
  distance:   number;
  durationMs: number;
}

/** Nodo bruto extraído del OSM (lat/lon) */
export interface Node {
  id:  string;
  lat: number;
  lon: number;
}

/** Arista bruta extraída del OSM */
export interface Edge {
  from: string;
  to:   string;
  weight?: string;
}