import { Router } from 'express';
const router = Router();

router.post('/upload', async (req, res) => {
    res.json({ message: 'Endpoint para puntos funcionando' });
});

export default router;