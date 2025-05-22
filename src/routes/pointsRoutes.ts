// src/routes/pointsRoutes.ts
import { Router, Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { parse } from 'csv-parse/sync';
import { snapPointsToNetwork, RawPoint } from '../services/networkService';

const router = Router();

interface FileUploadRequest extends Request {
  files?: { file?: UploadedFile };
}

router.post('/upload-points', async (req: Request, res: Response) => {
  const fileReq = req as FileUploadRequest;

  if (!fileReq.files?.file) {
    return res.status(400).json({
      success: false,
      error: 'Archivo .tsv requerido'
    });
  }

  try {
    const tsv = fileReq.files.file.data.toString('utf-8');
    const records = parse(tsv, {
      columns: true,
      delimiter: '\t',
      skip_empty_lines: true
    }) as Array<{ [key: string]: string }>;

    // Mapeamos al tipo RawPoint
    const points: RawPoint[] = records.map((r) => ({
      id: r.id,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon)
    }));

    const snapped = await snapPointsToNetwork(points);

    return res.status(200).json({
      success: true,
      points: snapped
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
