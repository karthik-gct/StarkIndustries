import { describe, it, expect, vi, afterEach } from 'vitest'
import { validateJiraCredentials } from './jira.js'

afterEach(() => vi.restoreAllMocks())

describe('validateJiraCredentials', () => {
  it('returns ok:true when Jira responds 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
    const result = await validateJiraCredentials('https://test.atlassian.net', 'user@test.com', 'token123')
    expect(result.ok).toBe(true)
    expect(result.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('returns unauthorized when Jira responds 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    const result = await validateJiraCredentials('https://test.atlassian.net', 'user@test.com', 'bad-token')
    expect(result.ok).toBe(false)
    expect(result.error).toBe('unauthorized')
  })

  it('returns invalid_url for a malformed base URL', async () => {
    const result = await validateJiraCredentials('not-a-url', 'user@test.com', 'token')
    expect(result.ok).toBe(false)
    expect(result.error).toBe('invalid_url')
  })

  it('returns unreachable on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const result = await validateJiraCredentials('https://test.atlassian.net', 'user@test.com', 'token')
    expect(result.ok).toBe(false)
    expect(result.error).toBe('unreachable')
  })

  it('returns unreachable on AbortError (timeout)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('Aborted'), { name: 'AbortError' })))
    const result = await validateJiraCredentials('https://test.atlassian.net', 'user@test.com', 'token')
    expect(result.ok).toBe(false)
    expect(result.error).toBe('unreachable')
    expect(result.message).toMatch(/timed out/i)
  })
})
