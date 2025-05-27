
/** Conjunto completo de la red vial */
export interface NetworkData {
  nodes: Node[];   // usa el tipo Node que ya tienes
  edges: Edge[];   // usa el tipo Edge que ya tienes
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
  distance: number;
}