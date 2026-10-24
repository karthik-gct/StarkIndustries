import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, writeFile, readFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rmSync } from 'node:fs'
import request from 'supertest'
import { createApp } from '../../index.js'

const FIXTURE_AGENTS_MD = `# Agents Configuration

## Global Settings

\`\`\`yaml
PROD_MAX_LOOPS: 3
DEV_MAX_LOOPS: 5
QA_MAX_LOOPS: 3
DEV_COVERAGE_THRESHOLD: 80
PROD_EVAL_THRESHOLD: 8
\`\`\`

---

## ProdMgmtAgent

Some other content that must not be touched.
`

let tmpDir: string
let agentsMdPath: string

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'agents-test-'))
  agentsMdPath = join(tmpDir, 'Agents.md')
  await writeFile(agentsMdPath, FIXTURE_AGENTS_MD, 'utf8')
  process.env['MARK3_ROOT'] = tmpDir
})

afterEach(() => {
  delete process.env['MARK3_ROOT']
  rmSync(tmpDir, { recursive: true, force: true })
})

describe('GET /api/config/agents', () => {
  it('AC-1: returns current values from Global Settings block', async () => {
    const app = createApp()
    const res = await request(app).get('/api/config/agents')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      PROD_MAX_LOOPS: 3,
      DEV_MAX_LOOPS: 5,
      QA_MAX_LOOPS: 3,
      DEV_COVERAGE_THRESHOLD: 80,
      PROD_EVAL_THRESHOLD: 8,
    })
  })

  it('AC-5: returns fresh values after a PUT (no stale cache)', async () => {
    const app = createApp()
    await request(app).put('/api/config/agents').send({
      PROD_MAX_LOOPS: 5, DEV_MAX_LOOPS: 5, QA_MAX_LOOPS: 5,
      DEV_COVERAGE_THRESHOLD: 90, PROD_EVAL_THRESHOLD: 9,
    })
    const res = await request(app).get('/api/config/agents')
    expect(res.body.PROD_MAX_LOOPS).toBe(5)
    expect(res.body.PROD_EVAL_THRESHOLD).toBe(9)
  })

  it('AC-6: returns 422 when Global Settings block is missing', async () => {
    await writeFile(agentsMdPath, '# Agents\n\n## Other Section\n\nNo global settings.\n', 'utf8')
    const app = createApp()
    const res = await request(app).get('/api/config/agents')
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('BLOCK_NOT_FOUND')
  })

  it('returns 404 when Agents.md does not exist', async () => {
    rmSync(agentsMdPath)
    const app = createApp()
    const res = await request(app).get('/api/config/agents')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('FILE_NOT_FOUND')
  })
})

describe('PUT /api/config/agents', () => {
  it('AC-4: writes new values and preserves surrounding markdown', async () => {
    const app = createApp()
    const res = await request(app).put('/api/config/agents').send({
      PROD_MAX_LOOPS: 4, DEV_MAX_LOOPS: 4, QA_MAX_LOOPS: 2,
      DEV_COVERAGE_THRESHOLD: 85, PROD_EVAL_THRESHOLD: 9,
    })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    const written = await readFile(agentsMdPath, 'utf8')
    expect(written).toContain('PROD_MAX_LOOPS: 4')
    expect(written).toContain('DEV_COVERAGE_THRESHOLD: 85')
    // Surrounding markdown intact
    expect(written).toContain('## ProdMgmtAgent')
    expect(written).toContain('Some other content that must not be touched.')
  })

  it('AC-3: rejects DEV_COVERAGE_THRESHOLD below 50', async () => {
    const app = createApp()
    const res = await request(app).put('/api/config/agents').send({
      PROD_MAX_LOOPS: 3, DEV_MAX_LOOPS: 5, QA_MAX_LOOPS: 3,
      DEV_COVERAGE_THRESHOLD: 49, PROD_EVAL_THRESHOLD: 8,
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('INVALID_INPUT')
    // File unchanged
    const content = await readFile(agentsMdPath, 'utf8')
    expect(content).toContain('DEV_COVERAGE_THRESHOLD: 80')
  })

  it('rejects DEV_COVERAGE_THRESHOLD above 100', async () => {
    const app = createApp()
    const res = await request(app).put('/api/config/agents').send({
      PROD_MAX_LOOPS: 3, DEV_MAX_LOOPS: 5, QA_MAX_LOOPS: 3,
      DEV_COVERAGE_THRESHOLD: 101, PROD_EVAL_THRESHOLD: 8,
    })
    expect(res.status).toBe(400)
  })

  it('rejects missing fields', async () => {
    const app = createApp()
    const res = await request(app).put('/api/config/agents').send({ PROD_MAX_LOOPS: 3 })
    expect(res.status).toBe(400)
  })
})
