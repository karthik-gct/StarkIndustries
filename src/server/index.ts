<<<<<<< HEAD
import express from 'express'
import projectsRouter from './routes/config/projects.js'

export function createApp() {
  const app = express()
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    const { version } = JSON.parse(
      require('node:fs').readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')
    )
    res.json({ status: 'ok', version })
  })

  app.use('/api/config/projects', projectsRouter)

  return app
}

const PORT = parseInt(process.env.PORT || '3101')
const app = createApp()
app.listen(PORT, () => console.log(`StarkIndustries API on :${PORT}`))
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
