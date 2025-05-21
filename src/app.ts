import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import networkRoutes from './routes/networkRoutes';
import pointsRoutes from './routes/pointsRoutes';

// Load environment variables
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

app.use('/api/network', networkRoutes);
app.use('/api/points', pointsRoutes);

app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

export default app;