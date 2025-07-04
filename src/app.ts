import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';

import netWorkRoutes from './routes/networkRoutes';
import pointsRoutes from './routes/pointsRoutes';

// Load environment variables
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const uploadLimit = Math.floor(Number(process.env.UPLOAD_LIMIT_MB) * 1024 * 1024);

app.use(
  fileUpload({
    createParentPath: true,
    limits: { fileSize: uploadLimit },
    abortOnLimit: true,
  })
);

app.get('/api/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.use('/api/network', netWorkRoutes);
app.use('/api/points', pointsRoutes);

export default app;