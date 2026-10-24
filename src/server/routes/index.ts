import { Router } from 'express';
import modelsRouter from './config/models.js';

const router = Router();

router.use('/config/models', modelsRouter);

export default router;
