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
