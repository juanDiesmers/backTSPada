import { parseStringPromise } from 'xml2js';
import { Node, Edge } from '../types';

/**
 * Calcula la distancia en metros entre dos puntos geográficos
 * usando la fórmula de Haversine.
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6_371_000; // radio de la Tierra en metros
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Parsea el contenido OSM (XML) y devuelve nodos y aristas,
 * donde cada arista incluye el campo `distance`.
 */
export async function parseOSM(
  osmContent: string
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const result = await parseStringPromise(osmContent);
  const rawNodes: any[] = result.osm.node || [];
  const rawWays: any[] = result.osm.way || [];

  // 1. Extraer nodos
  const nodes: Node[] = rawNodes.map(n => ({
    id: n.$.id,
    lat: parseFloat(n.$.lat),
    lon: parseFloat(n.$.lon),
  }));

  // 2. Mapa para búsqueda rápida
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // 3. Extraer aristas con distancia
  const edges: Edge[] = [];
  for (const way of rawWays) {
    const refs: string[] = (way.nd || []).map((nd: any) => nd.$.ref);
    for (let i = 0; i < refs.length - 1; i++) {
      const from = refs[i];
      const to = refs[i + 1];
      const a = nodeMap.get(from);
      const b = nodeMap.get(to);
      if (a && b) {
        const distance = calculateDistance(a.lat, a.lon, b.lat, b.lon);
        edges.push({ from, to, distance });
        edges.push({ from: to, to: from, distance });
      }
    }
  }

  return { nodes, edges };
}