import { Router, Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { parseOSM } from '../utils/osmParser';

const router = Router();

interface FileUploadRequest extends Request {
  files?: {
    file?: UploadedFile;
  };
}

// POST / api/network/upload-osm
router.post('/upload-osm', async (req: Request, res: Response) => {
  try {
    // Casteo interno para acceder a files
    const fileReq = req as FileUploadRequest;

    if (!fileReq.files?.file) {
      return res.status(400).json({
        success: false,
        error: 'Archivo .osm requerido',
      });
    }

    // Leemos el contenido del OSM
    const osmContent = fileReq.files.file.data.toString('utf-8');
    const { nodes, edges} = await parseOSM(osmContent);

    return res.status (200).json({
      success: true,
      message: 'Malla vial procesada correctamente',
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodes,
      edges
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});