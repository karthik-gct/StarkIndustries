import { Router, Request, Response } from 'express'
import * as path from 'node:path'
import { readDotEnv, writeDotEnv, maskSecret, FileNotFoundError } from '../../lib/fileio/index.js'
import { validateJiraCredentials } from '../../lib/validators/jira.js'
import { validateAnthropicKey } from '../../lib/validators/anthropic.js'

const router = Router()

const CREDENTIAL_KEYS = [
  'ATLASSIAN_BASE_URL',
  'ATLASSIAN_EMAIL',
  'ATLASSIAN_API_TOKEN',
  'ANTHROPIC_API_KEY',
  'STARK_ENDPOINT',
] as const

type CredentialKey = (typeof CREDENTIAL_KEYS)[number]
const SECRET_KEYS: CredentialKey[] = ['ATLASSIAN_API_TOKEN', 'ANTHROPIC_API_KEY']

function getEnvPath(): string {
  const mark3Root = process.env['MARK3_ROOT'] ?? path.resolve(process.cwd(), '../Mark3')
  return path.join(mark3Root, '.env')
}

function isMasked(value: string): boolean {
  return value.includes('•')
}

router.get('/credentials', async (_req: Request, res: Response) => {
  let env: Record<string, string> = {}
  try {
    env = await readDotEnv(getEnvPath())
  } catch (err) {
    if (!(err instanceof FileNotFoundError)) {
      res.status(500).json({ error: 'READ_ERROR', message: 'Could not read .env file' })
      return
    }
  }

  const result: Record<CredentialKey, string> = {
    ATLASSIAN_BASE_URL: env['ATLASSIAN_BASE_URL'] ?? '',
    ATLASSIAN_EMAIL: env['ATLASSIAN_EMAIL'] ?? '',
    ATLASSIAN_API_TOKEN: maskSecret(env['ATLASSIAN_API_TOKEN'] ?? ''),
    ANTHROPIC_API_KEY: maskSecret(env['ANTHROPIC_API_KEY'] ?? ''),
    STARK_ENDPOINT: env['STARK_ENDPOINT'] ?? '',
  }

  res.json(result)
})

router.put('/credentials', async (req: Request, res: Response) => {
  const body = req.body as Partial<Record<CredentialKey, string>>

  for (const key of ['ATLASSIAN_BASE_URL', 'ATLASSIAN_EMAIL', 'ATLASSIAN_API_TOKEN', 'ANTHROPIC_API_KEY'] as const) {
    if (body[key] === undefined || body[key] === null) {
      res.status(400).json({ error: 'INVALID_INPUT', message: `Missing required field: ${key}` })
      return
    }
  }

  // Resolve final values: if masked (unchanged), keep existing .env value
  let existing: Record<string, string> = {}
  try {
    existing = await readDotEnv(getEnvPath())
  } catch (err) {
    if (!(err instanceof FileNotFoundError)) {
      res.status(500).json({ error: 'READ_ERROR', message: 'Could not read .env' })
      return
    }
  }

  const resolved: Record<CredentialKey, string> = {} as Record<CredentialKey, string>
  for (const key of CREDENTIAL_KEYS) {
    const submitted = body[key] ?? ''
    resolved[key] = isMasked(submitted) ? (existing[key] ?? '') : submitted
  }

  // Run live validation pings
  const [jiraResult, anthropicResult] = await Promise.all([
    validateJiraCredentials(
      resolved.ATLASSIAN_BASE_URL,
      resolved.ATLASSIAN_EMAIL,
      resolved.ATLASSIAN_API_TOKEN
    ),
    validateAnthropicKey(resolved.ANTHROPIC_API_KEY),
  ])

  const validation = { jira: jiraResult, anthropic: anthropicResult }

  if (!jiraResult.ok || !anthropicResult.ok) {
    res.status(422).json({ ok: false, validation })
    return
  }

  try {
    await writeDotEnv(getEnvPath(), resolved)
  } catch {
    res.status(500).json({ error: 'WRITE_ERROR', message: 'Failed to write .env' })
    return
  }

  res.json({ ok: true, validation })
})

export { router as credentialsRouter, SECRET_KEYS, CREDENTIAL_KEYS, getEnvPath }
export default router
