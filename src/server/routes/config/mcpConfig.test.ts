import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import express from 'express'
import { createMcpConfigRouter } from './mcpConfig.js'

let tmpDir: string
let settingsDir: string
let settingsPath: string

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'si-mcp-test-'))
  settingsDir = join(tmpDir, '.claude')
  await mkdir(settingsDir, { recursive: true })
  settingsPath = join(settingsDir, 'settings.json')
})

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true })
})

function buildApp(path: string) {
  const app = express()
  app.use(express.json())
  app.use('/api/config/mcp', createMcpConfigRouter(path))
  return app
}

const VALID_SETTINGS = JSON.stringify({
  mcpServers: {
    jira: {
      command: 'npx',
      args: ['-y', 'mcp-atlassian'],
      env: { ATLASSIAN_API_TOKEN: '${ATLASSIAN_API_TOKEN}' }
    }
  }
}, null, 2)

describe('GET /api/config/mcp', () => {
  it('AC-1 / AC-3: returns found, valid content, and lastModified', async () => {
    await writeFile(settingsPath, VALID_SETTINGS)
    const res = await request(buildApp(settingsPath)).get('/api/config/mcp')
    expect(res.status).toBe(200)
    expect(res.body.found).toBe(true)
    expect(res.body.valid).toBe(true)
    expect(res.body.content).toContain('mcpServers')
    expect(res.body.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('AC-4: returns found=false when settings.json does not exist', async () => {
    const res = await request(buildApp(settingsPath)).get('/api/config/mcp')
    expect(res.status).toBe(200)
    expect(res.body.found).toBe(false)
  })

  it('NFR-1: ${VAR} references returned as literal strings, not expanded', async () => {
    await writeFile(settingsPath, VALID_SETTINGS)
    const res = await request(buildApp(settingsPath)).get('/api/config/mcp')
    expect(res.body.content).toContain('${ATLASSIAN_API_TOKEN}')
  })

  it('returns valid=false and content preserved for malformed JSON', async () => {
    await writeFile(settingsPath, '{ invalid json here')
    const res = await request(buildApp(settingsPath)).get('/api/config/mcp')
    expect(res.body.found).toBe(true)
    expect(res.body.valid).toBe(false)
    expect(res.body.content).toBe('{ invalid json here')
  })

  it('truncates files larger than 100KB and sets truncated=true', async () => {
    const bigContent = '{"x":"' + 'a'.repeat(110_000) + '"}'
    await writeFile(settingsPath, bigContent)
    const res = await request(buildApp(settingsPath)).get('/api/config/mcp')
    expect(res.body.truncated).toBe(true)
    expect(res.body.content.length).toBeLessThanOrEqual(100_000)
  })
})
