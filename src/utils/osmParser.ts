import { parseStringPromise } from 'xml2js';

export interface Node {
  id: string;
  lat: number;
  lon: number;
}

export interface Edge {
  from: string;
  to: string;
}

export async function parseOSM(osmContent: string): Promise<{ nodes: Node[], edges: Edge[] }> {
  const result = await parseStringPromise(osmContent);
  const rawNodes = result.osm.node || [];
  const rawWays = result.osm.way || [];

  // Extraer nodos
  const nodes: Node[] = rawNodes.map((n: any) => ({
    id: n.$.id,
    lat: parseFloat(n.$.lat),
    lon: parseFloat(n.$.lon)
  }));

  // Crear un mapa para validación rápida de nodos existentes
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Extraer aristas conectando nodos de los ways
  const edges: Edge[] = [];
  for (const way of rawWays) {
    const refs = (way.nd || []).map((nd: any) => nd.$.ref);
    for (let i = 0; i < refs.length - 1; i++) {
      const from = refs[i];
      const to = refs[i + 1];
      if (nodeMap.has(from) && nodeMap.has(to)) {
        edges.push({ from, to });
        // Si quieres que la red sea bidireccional:
        edges.push({ from: to, to: from });
      }
    }
  }

  return { nodes, edges };
}
