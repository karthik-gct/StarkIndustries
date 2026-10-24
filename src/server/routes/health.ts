import { Router } from 'express';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version } = require('../../../package.json') as { version: string };

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok', version });
});
