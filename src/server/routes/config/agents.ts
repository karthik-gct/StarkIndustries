import { Router, Request, Response } from 'express'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  parseMarkdownYamlBlock,
  injectMarkdownYamlBlock,
  writeAtomic,
  BlockNotFoundError,
  AGENTS_GLOBAL_SETTINGS_HEADING
} from '../../lib/fileio/index.js'
import type { AgentLimitsConfig } from '../../../shared/types/agentConfig.js'

const router = Router()

function agentsMdPath(): string {
  const root = process.env['MARK3_ROOT'] ?? process.cwd()
  return resolve(root, 'Agents.md')
}

function validateLimits(body: unknown): { valid: true; data: AgentLimitsConfig } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Request body must be an object' }
  const b = body as Record<string, unknown>
  const fields: Array<{ key: keyof AgentLimitsConfig; min: number; max: number }> = [
    { key: 'PROD_MAX_LOOPS', min: 1, max: 10 },
    { key: 'DEV_MAX_LOOPS', min: 1, max: 10 },
    { key: 'QA_MAX_LOOPS', min: 1, max: 10 },
    { key: 'DEV_COVERAGE_THRESHOLD', min: 50, max: 100 },
    { key: 'PROD_EVAL_THRESHOLD', min: 1, max: 10 },
  ]
  for (const { key, min, max } of fields) {
    const val = b[key]
    if (val === undefined || val === null) return { valid: false, error: `Missing field: ${key}` }
    const n = Number(val)
    if (!Number.isInteger(n)) return { valid: false, error: `${key} must be an integer` }
    if (n < min || n > max) return { valid: false, error: `${key} must be between ${min} and ${max}` }
  }
  return {
    valid: true,
    data: {
      PROD_MAX_LOOPS: Number(b['PROD_MAX_LOOPS']),
      DEV_MAX_LOOPS: Number(b['DEV_MAX_LOOPS']),
      QA_MAX_LOOPS: Number(b['QA_MAX_LOOPS']),
      DEV_COVERAGE_THRESHOLD: Number(b['DEV_COVERAGE_THRESHOLD']),
      PROD_EVAL_THRESHOLD: Number(b['PROD_EVAL_THRESHOLD']),
    }
  }
}

router.get('/', async (_req: Request, res: Response) => {
  const filePath = agentsMdPath()
  let content: string
  try {
    content = await readFile(filePath, 'utf8')
  } catch {
    res.status(404).json({ error: 'FILE_NOT_FOUND', message: 'Agents.md not found' })
    return
  }
  try {
    const block = parseMarkdownYamlBlock(content, AGENTS_GLOBAL_SETTINGS_HEADING)
    res.json(block)
  } catch (err) {
    if (err instanceof BlockNotFoundError) {
      res.status(422).json({ error: 'BLOCK_NOT_FOUND', message: err.message })
    } else {
      res.status(500).json({ error: 'PARSE_ERROR', message: 'Failed to parse Global Settings block' })
    }
  }
})

router.put('/', async (req: Request, res: Response) => {
  const validation = validateLimits(req.body)
  if (!validation.valid) {
    res.status(400).json({ error: 'INVALID_INPUT', message: validation.error })
    return
  }

  const filePath = agentsMdPath()
  let content: string
  try {
    content = await readFile(filePath, 'utf8')
  } catch {
    res.status(404).json({ error: 'FILE_NOT_FOUND', message: 'Agents.md not found' })
    return
  }

  try {
    const updated = injectMarkdownYamlBlock(content, AGENTS_GLOBAL_SETTINGS_HEADING, validation.data)
    await writeAtomic(filePath, updated)
    res.json({ ok: true })
  } catch (err) {
    if (err instanceof BlockNotFoundError) {
      res.status(422).json({ error: 'BLOCK_NOT_FOUND', message: (err as Error).message })
    } else {
      res.status(500).json({ error: 'WRITE_ERROR', message: 'Failed to write Agents.md' })
    }
  }
})

export default router
