import { UploadedFile } from "express-fileupload";
import { NetworkData, Node, Edge } from "../types";

export const processNetworkFile = (file: UploadedFile): NetworkData => {
  // 1. Validar archivo
  if (!file.mimetype.includes('json')) {
    throw new Error ('Solo se permiten archivos JSON');
  }

  // 2. Parsear el contenido
  const content = file.data.toString('utf-8');
  const data = JSON.parse(content);

  // 3. Validar la estructura del JSON
  if (!data.nodes || !data.edges) {
    throw new Error ('El archivo debe contener nodos y aristas');
  }

  // 4. Transformar datos
  const nodes: Node[] = data.nodes.map((node: any) => ({
    id: String(node.id),
    lat: parseFloat(node.lat),
    lng: parseFloat(node.lng)
  }));

  const edges: Edge[] = data.edges.map((edge: any) => ({
    from: String(edge.from),
    to: String(edge.to),
    weight: parseFloat(edge.weight || '1')
  }));

  // 5. Validar referencias
  validateNetwork({ nodes, edges });
  return { nodes, edges };
};

const validateNetwork = (network: NetworkData) => {
  const nodeIds = new Set(network.nodes.map(n => n.id));

  network.edges.forEach(edge => {
    if (!nodeIds.has(edge.from)) throw new Error(`Nodo ${edge.from} no encontrado`);
    if (!nodeIds.has(edge.to)) throw new Error(`Nodo ${edge.to} no encontrado`);
  });
};
