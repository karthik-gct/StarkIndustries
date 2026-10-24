import { Router } from 'express';
import { healthRouter } from './health.js';
import credentialsRouter from './config/credentials.js';
import modelsRouter from './config/models.js';
import agentsRouter from './config/agents.js';
import projectsRouter from './config/projects.js';
import { createMcpConfigRouter } from './config/mcpConfig.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/config/credentials', credentialsRouter);
router.use('/config/models', modelsRouter);
router.use('/config/agents', agentsRouter);
router.use('/config/projects', projectsRouter);
router.use('/config/mcp', createMcpConfigRouter());

export default router;
