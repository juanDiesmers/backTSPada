import express from 'express';
import type { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { processNetworkFile } from '../controllers/networkController';
import { TSPService } from '../services/tspService';
import { NetworkData, Point } from '../types'; // Asegúrate de tener estos tipos definidos

const router = express.Router();

interface FileUploadRequest extends Request {
  files?: {
    file?: UploadedFile;
  };
}

// Ruta para cargar y procesar un archivo .osm y retornar la malla vial
router.post('/upload-osm', async (req: FileUploadRequest, res: Response) => {
  try {
    if (!req.files?.file) {
      return res.status(400).json({ error: 'Archivo .osm requerido' });
    }

    const osmContent = req.files.file.data.toString();
    const { nodes, edges } = await parseOSM(osmContent);

    return res.status(200).json({
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
      error: err.message
    });
  }
});

// Configuración mejorada para subida de archivos
router.post('/upload', async (req: Request, res: Response) => {
  const fileReq = req as FileUploadRequest;

  try {
    // Validación más robusta
    if (!fileReq.files || !fileReq.files.file) {
      return res.status(400).json({ 
        error: 'Archivo requerido',
        details: 'No se recibió ningún archivo en la solicitud'
      });
    }

    const file = fileReq.files.file;

    // Verificación del tipo de archivo
    if (!file.mimetype.includes('json') && !file.name.endsWith('.json')) {
      return res.status(400).json({
        error: 'Formato inválido',
        details: 'Solo se aceptan archivos JSON'
      });
    }

    // Procesamiento seguro del archivo
    const network = processNetworkFile(file);
    
    return res.json({
      success: true,
      nodeCount: network.nodes.length,
      edgeCount: network.edges.length,
      message: 'Red vial procesada correctamente'
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error en upload:', err);
    return res.status(500).json({
      error: 'Error al procesar red vial',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Endpoint mejorado para cálculo de ruta
router.post('/calculate-route', async (req: Request, res: Response) => {
  try {
    console.log("Body recibido:", req.body);
    
    const { network, points } = req.body;
    
    // Validación completa de los datos
    if (!network || !points) {
      return res.status(400).json({
        error: "Datos incompletos",
        details: "El cuerpo de la solicitud debe contener 'network' y 'points'"
      });
    }

    if (!Array.isArray(points)) {
      return res.status(400).json({
        error: "Formato inválido",
        details: "'points' debe ser un array"
      });
    }

    console.log("Puntos recibidos:", points);
    
    // Validación de puntos existentes en la red
    const invalidPoints = points.filter((p: Point) => 
      !network.nodes.some((n: { id: string }) => n.id === p.id)
    );
    
    if (invalidPoints.length > 0) {
      return res.status(400).json({
        error: "Puntos no encontrados",
        details: `Los siguientes puntos no existen en la red: ${invalidPoints.map(p => p.id).join(', ')}`
      });
    }

    const result = TSPService.nearestNeighbor(network, points);
    return res.json({
      ...result,
      message: 'Ruta calculada exitosamente'
    });
    
  } catch (error) {
    console.error("Error en calculate-route:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido",
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    });
  }
});

export default router;