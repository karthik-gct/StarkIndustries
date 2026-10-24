import express, { Express } from 'express'
import { apiRouter } from './routes/index.js'

export function createApp(): Express {
  const app = express()
  app.use(express.json())
  app.use('/api', apiRouter)
  return app
}
