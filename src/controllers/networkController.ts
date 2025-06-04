import { UploadedFile } from "express-fileupload";
import { NetworkData, Node, Edge } from "../types";

export const processNetworkFile = (file: UploadedFile): NetworkData => {
  // 1. Validar mimetype JSON
  if (!file.mimetype.includes("json")) {
    throw new Error("Solo se permiten archivos JSON");
  }

  // 2. Parsear el contenido
  const content = file.data.toString("utf-8");
  const data = JSON.parse(content);

  // 3. Validar estructura
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    throw new Error("El archivo JSON debe contener arrays 'nodes' y 'edges'");
  }

  // 4. Transformar nodos al tipo NetworkNode
  const nodes: Node[] = data.nodes.map((n: any) => ({
    id: String(n.id),
    lat: parseFloat(n.lat),
    lon: parseFloat(n.lon),
  }));

  // 5. Transformar aristas al tipo NetworkEdge (usando 'distance' en lugar de 'weight')
  const edges: Edge[] = data.edges.map((e: any) => {
    const dist = e.distance !== undefined
      ? parseFloat(e.distance)
      : e.weight !== undefined
        ? parseFloat(e.weight)
        : 1;

    return {
      from: String(e.from),
      to:   String(e.to),
      distance: isNaN(dist) ? 1 : dist
    };
  });

  // 6. Validar referencias
  validateNetwork({ nodes, edges });

  // 7. Devolver la red ya tipada
  return { nodes, edges };
};

const validateNetwork = (network: NetworkData) => {
  const ids = new Set(network.nodes.map(n => n.id));
  for (const edge of network.edges) {
    if (!ids.has(edge.from)) throw new Error(`Nodo '${edge.from}' no encontrado`);
    if (!ids.has(edge.to))   throw new Error(`Nodo '${edge.to}' no encontrado`);
  }
};
