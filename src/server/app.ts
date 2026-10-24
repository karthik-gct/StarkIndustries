<<<<<<< HEAD
import express, { Express } from 'express'
import { apiRouter } from './routes/index.js'

export function createApp(): Express {
  const app = express()
  app.use(express.json())
  app.use('/api', apiRouter)
  return app
=======
import express from 'express';
import { healthRouter } from './routes/health.js';

export function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/health', healthRouter);
  return app;
>>>>>>> origin/main
}
