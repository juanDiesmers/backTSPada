import { Router, Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { getMeshNodes } from '../services/meshService';
import { setPoints } from '../services/pointsService';
import { Point } from '../types';
import { get } from 'http';

interface FileUploadRequest extends Request {
  files?: {
    file?: UploadedFile;
  };
}

const router = Router();

// POST /api/points/upload-points
router.post('/upload-points', (req: Request, res: Response) => {
  const fileReq  = req as FileUploadRequest;

  // 1. Validar que venga el archivo .tsv
  if (!fileReq.files?.file) {
    return res.status(400).json({
      success: false,
      error: 'Archivo .tsv de puntos requerido'
    });
  }

  // 2. leer y parsear el TSV
  const tsv = fileReq.files.file.data.toString('utf-8').trim();
  const lines = tsv.split(/\r?\n/);
  if (lines.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'El archivo TSV no contiene datos'
    });
  }

  // Traer los nodos de la malla
  const meshNodes = getMeshNodes();
  if (meshNodes.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No hay malla cargada. Primero sube un archivo OSM para crear la malla'
    });
  }

  // Funcion que encuentra el nodo mas cercano
  function snapToNode(lat: number, lng: number) {
    let minDist = Infinity;
    let nearest = meshNodes[0];
    for (const n of meshNodes) {
      const dLat = n.lat - lat;
      const dLon = n.lon - lng;
      const dist2 = dLat * dLat + dLon * dLon;
      if (dist2 < minDist) {
        minDist = dist2;
        nearest = n;
      }
    }
    return nearest;
  }

  // 3. Cabeceras 
  const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());
  const xi = headers.indexOf('x');
  const yi = headers.indexOf('y');
  const idi = headers.indexOf('id');
  if (xi < 0 || yi < 0 || idi < 0) {
    return res.status(400).json({
      success: false,
      error: 'El archivo TSV debe contener las columnas x, y e id'
    });
  }

  // 4. Construit array de puntos
  const points = lines.slice(1).map(line => {
    const cols = line.split('\t');
    const origLng = parseFloat(cols[xi]);
    const origLat = parseFloat(cols[yi]);
    const id      = cols[idi].trim();

    // Snap al nodo más cercano
    const node = snapToNode(origLat, origLng);
    return {
      id: node.id,
      // coordenadas alineadas
      lat: node.lat,
      lng: node.lon,
      // opcional: id del nodo al que se alinea
      snappedTo: node.id
    };
  });

  setPoints(points);

  return res.status(200).json({ points });
});

export default router;