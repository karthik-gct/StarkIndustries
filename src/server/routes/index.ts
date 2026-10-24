<<<<<<< HEAD
import { Router } from 'express'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import mcpConfigRouter from './config/mcpConfig.js'

export const apiRouter = Router()

const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '../../../package.json')
const { version } = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string }

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', version })
})

apiRouter.use('/config/mcp', mcpConfigRouter)
=======
import { Router } from 'express';
import modelsRouter from './config/models.js';

const router = Router();

router.use('/config/models', modelsRouter);

export default router;
>>>>>>> origin/main
