import { Router, Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { parseOSM, Node, Edge } from '../utils/osmParser';

const router = Router();

interface FileUploadRequest extends Request {
  files?: {
    file?: UploadedFile;
  };
}

// POST / api/network/upload-osm
router.post('/upload-osm', async (req: Request, res: Response)  => {
  const fileReq = req as FileUploadRequest;

  // 1. Validar que venga el archivo .osm
  if (!fileReq.files?.file) {
    return res.status(400).json({
      success: false,
      error: 'Archivo .osm requerido'
    });
  }

  try {
    // 2. Parsear el XML del OSM
    const xml = fileReq.files.file.data.toString('utf-8');
    const { nodes, edges }: { nodes: Node[], edges: Edge[] } = await parseOSM(xml);

    // 3. Preparar un mapa rapido de nodos para coordenadas
    const nodeMap = new Map (nodes.map(n => [n.id, n]));

    // 4. Contruir el array de features GeoJSON
    const features: any[] = [];

    // 4.1 Features de tipo Point (nodos)
    for (const n of nodes) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [n.lon, n.lat]
        },
        properties: {id: n.id }
      });
    }

    //4.2 Features de tipo LineString (aristas)
    for (const e of edges) {
      const a = nodeMap.get(e.from)!;
      const b = nodeMap.get(e.to)!;
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [a.lon, a.lat],
            [b.lon, b.lat]
          ]
        },
        properties: { from: e.from, to: e.to }
      });
    }

    // 5. Devolver el FeatureCollection al front
    return res.status(200).json({
      type: 'FeatureCollection',
      features
    });

  } catch (err) {
    const error = err as Error;
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;