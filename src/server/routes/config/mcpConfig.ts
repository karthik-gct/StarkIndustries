import { Router } from 'express'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const MAX_BYTES = 100_000

export function createMcpConfigRouter(settingsPath?: string): Router {
  const router = Router()

  router.get('/', async (_req, res) => {
    const filePath = settingsPath ?? resolve(process.cwd(), '.claude/settings.json')
    try {
      const fileStat = await stat(filePath)
      const raw = await readFile(filePath, 'utf-8')

      const truncated = Buffer.byteLength(raw, 'utf-8') > MAX_BYTES
      const content = truncated ? raw.slice(0, MAX_BYTES) : raw

      let valid = true
      try { JSON.parse(raw) } catch { valid = false }

      res.json({ found: true, valid, truncated, content, lastModified: fileStat.mtime.toISOString() })
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        res.json({ found: false })
        return
      }
      console.error('mcpConfig GET error:', err)
      res.status(500).json({ error: 'Internal error' })
    }
  })

  return router
}

export default createMcpConfigRouter()
