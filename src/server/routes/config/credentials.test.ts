import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { createApp } from '../../index.js'

// Mock validators so tests don't make real HTTP calls
vi.mock('../../lib/validators/jira.js', () => ({
  validateJiraCredentials: vi.fn().mockResolvedValue({ ok: true, latencyMs: 100 }),
}))
vi.mock('../../lib/validators/anthropic.js', () => ({
  validateAnthropicKey: vi.fn().mockResolvedValue({ ok: true, latencyMs: 100 }),
}))

import { validateJiraCredentials } from '../../lib/validators/jira.js'
import { validateAnthropicKey } from '../../lib/validators/anthropic.js'

const mockJira = vi.mocked(validateJiraCredentials)
const mockAnthropic = vi.mocked(validateAnthropicKey)

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'si-test-'))
  process.env['MARK3_ROOT'] = tmpDir
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
  delete process.env['MARK3_ROOT']
  vi.clearAllMocks()
})

const app = createApp()

// AC-5 + AC-6: GET returns masked/empty values — never full token
describe('GET /api/config/credentials', () => {
  it('AC-6: returns empty fields when .env does not exist', async () => {
    const res = await request(app).get('/api/config/credentials')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      ATLASSIAN_BASE_URL: '',
      ATLASSIAN_EMAIL: '',
      ATLASSIAN_API_TOKEN: '',
      ANTHROPIC_API_KEY: '',
      STARK_ENDPOINT: '',
    })
  })

  it('AC-5 (security): token fields are masked — never returns full value', async () => {
    const envContent = [
      'ATLASSIAN_BASE_URL=https://example.atlassian.net',
      'ATLASSIAN_EMAIL=user@example.com',
      'ATLASSIAN_API_TOKEN=ATATT3xFfGF0hGzjvSECRETTOKEN12345',
      'ANTHROPIC_API_KEY=sk-ant-api-SECRETKEY99999',
      'STARK_ENDPOINT=',
    ].join('\n')
    await fs.writeFile(path.join(tmpDir, '.env'), envContent, 'utf8')

    const res = await request(app).get('/api/config/credentials')
    expect(res.status).toBe(200)

    // First 4 chars visible, rest masked
    expect(res.body.ATLASSIAN_API_TOKEN).toMatch(/^ATAT/)
    expect(res.body.ATLASSIAN_API_TOKEN).toContain('•')
    expect(res.body.ATLASSIAN_API_TOKEN).not.toBe('ATATT3xFfGF0hGzjvSECRETTOKEN12345')

    expect(res.body.ANTHROPIC_API_KEY).toMatch(/^sk-a/)
    expect(res.body.ANTHROPIC_API_KEY).toContain('•')
    expect(res.body.ANTHROPIC_API_KEY).not.toBe('sk-ant-api-SECRETKEY99999')

    // Non-secret fields are returned as-is
    expect(res.body.ATLASSIAN_BASE_URL).toBe('https://example.atlassian.net')
    expect(res.body.ATLASSIAN_EMAIL).toBe('user@example.com')
  })
})

// AC-2 + AC-3: Validate & Save triggers pings and writes .env
describe('PUT /api/config/credentials — success path', () => {
  it('AC-2: calls both Jira and Anthropic validators', async () => {
    const res = await request(app)
      .put('/api/config/credentials')
      .send({
        ATLASSIAN_BASE_URL: 'https://example.atlassian.net',
        ATLASSIAN_EMAIL: 'user@example.com',
        ATLASSIAN_API_TOKEN: 'ATATT3xFullToken',
        ANTHROPIC_API_KEY: 'sk-ant-FullKey',
        STARK_ENDPOINT: '',
      })

    expect(res.status).toBe(200)
    expect(mockJira).toHaveBeenCalledOnce()
    expect(mockAnthropic).toHaveBeenCalledOnce()
    expect(res.body.ok).toBe(true)
  })

  it('AC-3: writes .env atomically when validation passes', async () => {
    const payload = {
      ATLASSIAN_BASE_URL: 'https://example.atlassian.net',
      ATLASSIAN_EMAIL: 'user@example.com',
      ATLASSIAN_API_TOKEN: 'ATATT3xFullToken',
      ANTHROPIC_API_KEY: 'sk-ant-FullKey',
      STARK_ENDPOINT: '',
    }

    const res = await request(app).put('/api/config/credentials').send(payload)
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    const written = await fs.readFile(path.join(tmpDir, '.env'), 'utf8')
    expect(written).toContain('ATLASSIAN_BASE_URL=https://example.atlassian.net')
    expect(written).toContain('ATLASSIAN_API_TOKEN=ATATT3xFullToken')
  })
})

// AC-4: Invalid token blocks write
describe('PUT /api/config/credentials — validation failure', () => {
  it('AC-4: returns 422 and does NOT write .env when Jira validation fails', async () => {
    mockJira.mockResolvedValueOnce({ ok: false, error: 'unauthorized', message: '401 Unauthorized' })

    const res = await request(app)
      .put('/api/config/credentials')
      .send({
        ATLASSIAN_BASE_URL: 'https://example.atlassian.net',
        ATLASSIAN_EMAIL: 'user@example.com',
        ATLASSIAN_API_TOKEN: 'invalid-token',
        ANTHROPIC_API_KEY: 'sk-ant-FullKey',
        STARK_ENDPOINT: '',
      })

    expect(res.status).toBe(422)
    expect(res.body.ok).toBe(false)
    expect(res.body.validation.jira.ok).toBe(false)

    // .env must NOT have been written
    await expect(fs.access(path.join(tmpDir, '.env'))).rejects.toThrow()
  })
})

// AC-1: PUT body with masked value preserves existing .env field
describe('PUT /api/config/credentials — masked field handling', () => {
  it('preserves existing .env value when masked sentinel is submitted', async () => {
    // Write an initial .env
    await fs.writeFile(
      path.join(tmpDir, '.env'),
      'ATLASSIAN_API_TOKEN=ORIGINAL_TOKEN\nANTHROPIC_API_KEY=ORIGINAL_KEY\nATLASSIAN_BASE_URL=https://old.atlassian.net\nATLASSIAN_EMAIL=old@example.com\nSTARK_ENDPOINT=\n',
      'utf8'
    )

    // Submit with masked token (unchanged) but new URL
    const res = await request(app)
      .put('/api/config/credentials')
      .send({
        ATLASSIAN_BASE_URL: 'https://new.atlassian.net',
        ATLASSIAN_EMAIL: 'new@example.com',
        ATLASSIAN_API_TOKEN: 'ORIG••••••••••••',  // masked — should keep ORIGINAL_TOKEN
        ANTHROPIC_API_KEY: 'ORIG••••••••',         // masked — should keep ORIGINAL_KEY
        STARK_ENDPOINT: '',
      })

    expect(res.status).toBe(200)
    const written = await fs.readFile(path.join(tmpDir, '.env'), 'utf8')
    expect(written).toContain('ATLASSIAN_API_TOKEN=ORIGINAL_TOKEN')
    expect(written).toContain('ANTHROPIC_API_KEY=ORIGINAL_KEY')
    expect(written).toContain('ATLASSIAN_BASE_URL=https://new.atlassian.net')
  })
})
