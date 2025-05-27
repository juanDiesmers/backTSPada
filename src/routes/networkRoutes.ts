import { Router, Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { parseOSM} from '../utils/osmParser';
import { setMesh, getMeshNodes, getMeshEdges } from '../services/meshService';
import { getPoints } from '../services/pointsService';
import { TSPService } from '../services/tspService';
import {  NetworkData, Node, Edge} from '../types';

interface FileUploadRequest extends Request {
  files?: {
    file?: UploadedFile;
  };
}

const router = Router();

// POST / api/network/upload-osm
router.post('/upload-osm', async (req: Request, res: Response) => {
  const fileReq = req as FileUploadRequest;

  // 1. Validar que venga el archivo .osm
  if (!fileReq.files?.file) {
    return res.status(400).json({
      success: false,
      error: 'Archivo .osm requerido'
    });
  }

  // 2. Leer contenido
  const xml = fileReq.files.file.data.toString('utf-8');
  if (!xml.trim()) {
    return res.status(400).json({
      success: false,
      error: 'El archivo .osm esta vacion o malformado'
    });
  }

  try {
    
    const { nodes, edges }: { nodes: Node[]; edges: Edge[] } = await parseOSM(xml);

    // Guardar la malla en memoria
    setMesh(nodes, edges);
  
    // Construir GeoJSON para el front
    const features: any[] = [];


    // Features de tipo Point
    for (const n of nodes) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [n.lon, n.lat] },
        properties: { id: n.id }
      });
    }

    //4.2 Features de tipo LineString (aristas)
    for (const e of edges) {
      const a = nodes.find(node => node.id === e.from)!;
      const b = nodes.find(node => node.id === e.to)!;
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [a.lon, a.lat],
            [b.lon, b.lat]
          ]
        },
        properties: { from: e.from, to: e.to, distance: e.distance }
      });
    }

    // 5. Devolver el FeatureCollection al front
    return res.status(200).json({ type: 'FeatureCollection', features });

  } catch (err) {
    console.error('Error en /upload-osm:', (err as Error).stack);
    const error = err as Error;
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/network/tsp?type=brute|nearest|genetic
router.get('/tsp', (req: Request, res: Response) => {
  const type = String(req.query.type).toLowerCase();
  const points = getPoints();
  if (points.length === 0) {
    return res.status(400).json({ success: false, error: 'Primero carga los puntos.' });
  }

  // Recuperar la malla de memoria
  const nodes = getMeshNodes();
  const edges = getMeshEdges();
  const mesh: NetworkData = { nodes, edges };

  let result;
  try {
    switch (type) {
      case 'brute':
        result = TSPService.bruteForce(mesh, points.map(p => p.id));
        break;
      case 'nearest':
        result = TSPService.nearestNeighbor(mesh, points.map(p => p.id));
        break;
      case 'genetic':
        result = TSPService.geneticAlgorithm(mesh, points.map(p => p.id));
        break;
      default:
        return res.status(400).json({ success: false, error: 'Algoritmo desconocido.' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }

  // Convertir path de IDs a coordenadas [lat, lon]
  const coords: [number, number][] = result.path.map(id => {
    const n = nodes.find(node => node.id === id);
    if (!n) throw new Error(`Nodo ${id} no existe en la malla`);
    return [n.lat, n.lon];
  });

  const colors: Record<string, string> = {
    brute: 'red',
    nearest: 'green',
    genetic: 'blue'
  };

  return res.json({
    path: coords,
    distance: result.distance,
    time: result.durationMs,
    color: colors[type] || 'black'
  });
});


export default router;