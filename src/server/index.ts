import express from 'express'
import { credentialsRouter } from './routes/config/credentials.js'

export function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/config', credentialsRouter)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', version: '0.1.0' })
  })
  return app
}

const PORT = Number(process.env['PORT'] ?? 3100)
createApp().listen(PORT, () => {
  console.log(`StarkIndustries server running on http://localhost:${PORT}`)
})
