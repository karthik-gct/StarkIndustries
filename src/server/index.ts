<<<<<<< HEAD
import express from 'express'
import agentsRouter from './routes/config/agents.js'

export function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/config/agents', agentsRouter)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', version: '0.1.0' })
  })
  return app
}

const PORT = parseInt(process.env['PORT'] ?? '3100', 10)
const app = createApp()
app.listen(PORT, () => console.log(`StarkIndustries server running on http://localhost:${PORT}`))
=======
import 'dotenv/config';
import express from 'express';
import apiRouter from './routes/index.js';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', version: '0.1.0' });
  });
  return app;
}

const PORT = parseInt(process.env.PORT ?? '3100');
const app = createApp();
app.listen(PORT, () => {
  console.log(`StarkIndustries server listening on http://localhost:${PORT}`);
});
>>>>>>> origin/main
