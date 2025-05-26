// src/server.ts

const PORT = process.env.PORT || 5000;
import cors from 'cors';
import express from 'express';
import fileUpload from 'express-fileupload';

import netWorkRoutes from './routes/networkRoutes';
import pointsRoutes  from './routes/pointsRoutes';

const app = express();

app.use(cors({ origin: ['http://127.0.0.1:5500'] }));

// COnfigurar el middleware una sola vez
app.use(express.json());
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
}));

// Montar el router
app.use('/api/network', netWorkRoutes);
app.use('/api/points', pointsRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});